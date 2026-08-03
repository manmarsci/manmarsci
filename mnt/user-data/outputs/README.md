# manmarsci — Marketing Science Portfolio

Static multi-page portfolio site (HTML + Tailwind CSS via CDN) for Abdul Manan.

## Pages
- index.html — Home
- advanced-projects.html — Projects / case study index
- case-study-01.html .. case-study-04.html — Individual case studies
- experience.html — CV / experience
- growth-tracker.html — Personal growth roadmap
- contact.html — Contact form
- worker/ — Cloudflare Worker that bridges the contact form to MotherDuck (see worker/README.md)

## Changes in this pass
- Contact form now POSTs (as JSON) to a Cloudflare Worker (worker/contact-worker.js)
  which inserts submissions into MotherDuck. See worker/README.md for full setup —
  you need to create the table in MotherDuck, deploy the Worker, and put its real
  URL into contact.html's form action. The MotherDuck token can't safely live in
  the browser (it grants broad read/write access), so this Worker is the minimum
  server-side piece needed to keep it private. It's your own small function
  running on Cloudflare's free tier, not a third-party form service.
- Resume/experience page updated with real content from the uploaded CV
  (Abdul Manan): the hero summary, all four experience timeline entries, and
  the skills/technical-arsenal section on experience.html now reflect the real
  work history (muSharp, LUUX Media, Upwork, Upside.Digital) and real toolset
  (GTM, Tealium, GA4, Python, GCP/BigQuery, Looker Studio, etc.). Also added
  an Education & Credentials section (BS Mechanical Engineering — UET Taxila;
  Google Advanced Data Analytics Certificate; Tealium Certifications), and
  removed a dead block of JavaScript accidentally copy-pasted into
  experience.html from the growth tracker page (it referenced a
  todo-container element that doesn't exist on this page and was throwing a
  console error on load).
- CV download now serves the real uploaded resume at assets/manmarsci-cv.pdf
  (previously a placeholder). If the file is ever missing, the button shows
  an honest error toast instead of a fake "download started" message.
- LinkedIn and email across all pages now point to the real profile
  (linkedin.com/in/abdul-manan-15872b207) and inbox
  (intermarkjoined@gmail.com) from the resume. GitHub is still a placeholder
  — swap in the real profile URL (flagged with TODO comments in every file).
- SEO — added meta description, canonical URL, Open Graph, and Twitter Card
  tags to every page's head, plus a generated assets/og-image.png share
  image. These use https://manmarsci.com as the placeholder domain — update
  to your real domain once you deploy.
- Dates — copyright year and "available for partnerships" copy updated off
  the stale 2024/2024-2025 references.
- Accessibility — decorative Material Symbol icons are now
  aria-hidden="true"; icon-only nav buttons (hamburger/close) have
  aria-labels and aria-expanded state; the mobile menu closes on Escape and
  returns focus to the triggering button.
- Stat credibility — the "22% Avg. CRO Uplift" stat on the homepage now
  links through to the case study that backs it up. The underlying numbers
  (4+ years, 150+ models) aren't in the resume — I didn't invent or verify
  these, only linked what could be linked.

## Still needs a human decision
- Tailwind CDN to production build. The site currently loads
  cdn.tailwindcss.com at runtime, which Tailwind's own docs advise against
  for production (slower, larger, no purge). To fix properly, on a machine
  with internet access:
  npm install -D tailwindcss
  npx tailwindcss init
  (point content: ["./*.html"] at your HTML files in tailwind.config.js,
  move the inline tailwind.config script's theme.extend into that config)
  npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify
  Then swap the cdn.tailwindcss.com script tag for a single
  link rel="stylesheet" href="dist/output.css". This couldn't be done here
  because this environment has no package registry access.
- Color contrast — spot-check text-on-surface-variant (#45474c) and similar
  muted text colors against their backgrounds with a contrast checker (e.g.
  WebAIM) for WCAG AA compliance; a couple of combinations look borderline.
- Shared header/footer — nav, mobile menu, and footer markup is still
  duplicated across all 9 HTML files. Fine as-is, but if you add more pages
  it's worth moving to a static site generator (11ty, Astro) or a small
  build step that injects a shared partial, so you only edit the nav once.
- GitHub link — still a placeholder in every file's footer; swap in your
  real profile URL.
- MotherDuck Worker deployment — worker/contact-worker.js is written and
  ready, but it has to actually be deployed (see worker/README.md); I
  couldn't do this from inside this sandbox since it needs npm/Cloudflare
  account access.
