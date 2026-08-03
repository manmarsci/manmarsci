# Contact form → MotherDuck bridge

Why this exists: MotherDuck tokens grant broad read/write access to your
account. The browser can't safely hold that token — anyone could read it out
of the page's JavaScript and get full access to your data. This tiny
Cloudflare Worker is the smallest amount of server-side code needed to keep
the token private while still avoiding a third-party form service (Formspree,
etc.) and a heavier backend. It's free on Cloudflare's free tier for this
volume of traffic.

## One-time setup

**1. Create the table in MotherDuck.** Open the MotherDuck SQL editor
(motherduck.com, or `duckdb` CLI with `ATTACH 'md:'`) and run:

```sql
CREATE DATABASE IF NOT EXISTS portfolio;
USE portfolio;
CREATE SEQUENCE IF NOT EXISTS contact_submissions_seq START 1;
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER DEFAULT nextval('contact_submissions_seq'),
  name VARCHAR,
  email VARCHAR,
  subject VARCHAR,
  message VARCHAR,
  submitted_at TIMESTAMP
);
```

**2. Get a MotherDuck token.** motherduck.com → your profile / Settings →
Tokens → create a read/write token. Copy it somewhere safe (you won't be
able to see it again).

**3. Install Wrangler and deploy** (needs a machine with internet access —
this couldn't be done from inside this sandbox):

```bash
npm install -g wrangler
wrangler login

cd worker
wrangler deploy
wrangler secret put MOTHERDUCK_TOKEN
# paste the MotherDuck token when prompted, press enter
wrangler secret put ALLOWED_ORIGIN
# enter your real site origin, e.g. https://manmarsci.com
# (use * only while testing locally — it allows any site to call your Worker)
```

Wrangler will print your Worker's URL after `wrangler deploy`, something like:

```
https://portfolio-contact-form.your-subdomain.workers.dev
```

**4. Point the site at it.** In `contact.html`, find:

```html
<form ... action="https://portfolio-contact-form.YOUR-WORKER-SUBDOMAIN.workers.dev" method="POST">
```

and replace the URL with the real one Wrangler gave you.

**5. Test it.** Submit the live form, then in MotherDuck run:

```sql
SELECT * FROM portfolio.contact_submissions ORDER BY submitted_at DESC;
```

While testing, `wrangler tail` (run in the `worker/` folder) streams live
logs from the Worker, which is the fastest way to see what's failing if a
submission doesn't show up.

## Notes / limitations

- **SQL escaping, not full parameterization.** MotherDuck's HTTP/MCP
  interface (the only public HTTP write path at the time this was written)
  takes a literal SQL string rather than parameterized query arguments. The
  Worker escapes single quotes before building the INSERT, which blocks the
  common injection pattern, but it's not the same guarantee as a real
  parameterized driver. If this ever becomes a concern, consider having the
  Worker call MotherDuck through a lightweight backend using the official
  DuckDB client library instead (Python/Node), which does support real
  parameter binding — that would mean moving off Cloudflare Workers, since
  the native DuckDB driver won't run in that runtime.
- **This API surface is newer/evolving.** MotherDuck's write-capable HTTP
  endpoint is MCP-based (`query_rw` tool at `api.motherduck.com/mcp`) rather
  than a traditional REST insert endpoint — this is what's documented today,
  but check MotherDuck's docs if the Worker starts getting errors, in case
  the interface has changed.
- **No spam protection.** This form has no CAPTCHA or rate limiting. If you
  start getting spam, add a honeypot field (a hidden input real users won't
  fill in; reject submissions where it's non-empty) or Cloudflare Turnstile,
  which is free and pairs naturally with a Worker.
