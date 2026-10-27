# Portfolio rebuild: how to push it

This bundle mirrors the repo layout (index.html, CSS/, JS/, Public/).
Assets/ and favicon.ico are NOT included; keep the ones already in the repo.

1. Copy everything in this folder over the repo root, replacing files.
2. Delete the old files that nothing uses any more:
   CSS/igvirnm.css, CSS/nlds.css
   JS/aboutme.js, JS/blogs.js, JS/contactme.js, JS/igvirnm.js, JS/nlds.js
3. Commit and push. Netlify serves it as before (/public/<page> URLs unchanged).

Needs internet on the visitor's side for GSAP, ScrollTrigger and Lenis (CDN) and Google Fonts.
If the CDN scripts fail, the pages still work, just without animation.
