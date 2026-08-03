# manmarsci — Marketing Science Portfolio

Static multi-page portfolio site (HTML + Tailwind CSS via CDN).

## Pages
- `index.html` — Home
- `advanced-projects.html` — Projects / case study index
- `case-study-01.html` .. `case-study-04.html` — Individual case studies
- `experience.html` — CV / experience
- `growth-tracker.html` — Personal growth roadmap
- `contact.html` — Contact form

## Changes in this pass
- **Contact form** now POSTs to Formspree (`contact.html`). **You must replace
  `YOUR_FORM_ID`** in the form's `action` attribute with your real Formspree
  form ID (free signup at https://formspree.io) or it will fail silently to
  users and show an error toast.
- **CV download** button now does a real fetch/download of
  `assets/manmarsci-cv.pdf`. A placeholder PDF is included so the button
  works today — **replace `assets/manmarsci-cv.pdf` with your real resume**,
  keeping the same filename. If the file is missing, the button now shows an
  honest error toast instead of a fake "download started" message.
- **Social links / email** — `linkedin.com`, `github.com`, and
  `hello@manmarsci.com` are placeholders in every footer/contact block
  (flagged with `<!-- TODO -->` comments in the HTML). Swap in your real
  profile URLs and inbox.
- **SEO** — added `<meta name="description">`, canonical URL, Open Graph, and
  Twitter Card tags to every page's `<head>`, plus a generated
  `assets/og-image.png` share image. These use `https://manmarsci.com` as the
  placeholder domain — update to your real domain once you deploy.
- **Dates** — copyright year and "available for partnerships" copy updated
  off the stale 2024/2024-2025 references.
- **Accessibility** — decorative Material Symbol icons are now
  `aria-hidden="true"`; icon-only nav buttons (hamburger/close) have
  `aria-label`s and `aria-expanded` state; the mobile menu closes on
  Escape and returns focus to the triggering button.
- **Stat credibility** — the "22% Avg. CRO Uplift" stat on the homepage now
  links through to the case study that backs it up. The underlying numbers
  (4+ years, 150+ models) are still yours to verify — I didn't invent or
  check these, only linked what could be linked.

## Still needs a human decision
- **Tailwind CDN to production build.** The site currently loads
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
- **Color contrast** — spot-check text-on-surface-variant (#45474c) and
  similar muted text colors against their backgrounds with a contrast
  checker (e.g. WebAIM) for WCAG AA compliance; a couple of combinations look
  borderline.
- **Shared header/footer** — nav, mobile menu, and footer markup is still
  duplicated across all 9 HTML files. Fine as-is, but if you add more pages
  it's worth moving to a static site generator (11ty, Astro) or a small
  build step that injects a shared partial, so you only edit the nav once.
