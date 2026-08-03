/**
 * Cloudflare Worker: receives the portfolio contact form submission and
 * writes it into a MotherDuck table, using MotherDuck's MCP-over-HTTP
 * endpoint (POST https://api.motherduck.com/mcp).
 *
 * WHY A WORKER AT ALL: MotherDuck tokens grant broad read/write access to
 * your account. If the contact form called MotherDuck directly from the
 * browser, the token would have to ship inside the page's JavaScript, where
 * anyone could read it (view-source, browser devtools, network tab) and get
 * full access to your databases. This Worker is the minimum needed to keep
 * that token server-side while still avoiding a bigger backend or a
 * third-party form service. It's your own code, on Cloudflare's free tier.
 *
 * SETUP
 * 1. Install Wrangler (Cloudflare's CLI) on a machine with internet access:
 *      npm install -g wrangler
 *      wrangler login
 * 2. In the MotherDuck SQL editor (motherduck.com), run once:
 *      CREATE DATABASE IF NOT EXISTS portfolio;
 *      USE portfolio;
 *      CREATE SEQUENCE IF NOT EXISTS contact_submissions_seq START 1;
 *      CREATE TABLE IF NOT EXISTS contact_submissions (
 *        id INTEGER DEFAULT nextval('contact_submissions_seq'),
 *        name VARCHAR,
 *        email VARCHAR,
 *        subject VARCHAR,
 *        message VARCHAR,
 *        submitted_at TIMESTAMP
 *      );
 * 3. Get a MotherDuck read/write token from motherduck.com -> Settings -> Tokens.
 * 4. From this `worker/` folder:
 *      wrangler deploy
 *      wrangler secret put MOTHERDUCK_TOKEN      # paste the token when prompted
 *      wrangler secret put ALLOWED_ORIGIN         # e.g. https://manmarsci.com
 * 5. Wrangler prints your Worker URL, e.g.
 *      https://portfolio-contact-form.YOUR-SUBDOMAIN.workers.dev
 *    Put that exact URL into contact.html's <form action="..."> attribute.
 * 6. Send a test submission from the live form and check the MotherDuck
 *    table (or `wrangler tail` while testing to see live logs/errors).
 */

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    let data;
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await request.json();
      } else {
        const form = await request.formData();
        data = Object.fromEntries(form.entries());
      }
    } catch {
      return json({ ok: false, error: 'Could not parse submission' }, 400);
    }

    const clean = (v, max) => (v == null ? '' : String(v).trim().slice(0, max));
    const name = clean(data.name, 200);
    const email = clean(data.email, 200);
    const subject = clean(data.subject, 100);
    const message = clean(data.message, 5000);

    if (!name || !email || !message) {
      return json({ ok: false, error: 'Name, email, and message are required' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'That email address looks invalid' }, 400);
    }

    // MotherDuck's HTTP/MCP interface takes a literal SQL string rather than
    // parameterized query args, so we escape single quotes ourselves. This
    // blocks the common injection vector but isn't a substitute for a real
    // parameterized driver if you later move this off the edge/HTTP path.
    const esc = (s) => s.replace(/'/g, "''");
    const database = env.MOTHERDUCK_DATABASE || 'portfolio';
    const sql = `INSERT INTO contact_submissions (name, email, subject, message, submitted_at)
      VALUES ('${esc(name)}', '${esc(email)}', '${esc(subject)}', '${esc(message)}', current_timestamp)`;

    let mdResponse;
    try {
      mdResponse = await fetch('https://api.motherduck.com/mcp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.MOTHERDUCK_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'MCP-Protocol-Version': '2024-11-05',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'query_rw',
            arguments: { database, sql },
          },
        }),
      });
    } catch (err) {
      console.error('MotherDuck request failed:', err);
      return json({ ok: false, error: 'Could not reach the database' }, 502);
    }

    const rawText = await mdResponse.text();
    let mdJson = null;
    try {
      mdJson = JSON.parse(rawText);
    } catch {
      // The MCP endpoint can reply as an SSE stream ("data: {...}") even
      // when only application/json was requested — handle that shape too.
      const dataLine = rawText.split('\n').find((line) => line.startsWith('data:'));
      if (dataLine) {
        try {
          mdJson = JSON.parse(dataLine.slice(5).trim());
        } catch {
          mdJson = null;
        }
      }
    }

    const failed =
      !mdResponse.ok ||
      !mdJson ||
      mdJson.error ||
      (mdJson.result && mdJson.result.isError);

    if (failed) {
      console.error('MotherDuck insert failed:', rawText);
      return json({ ok: false, error: 'Database insert failed' }, 502);
    }

    return json({ ok: true });
  },
};
