# LLM Campus

Ready for GitHub Pages deployment.

Repository expected:
https://advgrewal.github.io/LLMPURCL/

## Upload structure

LLMPURCL/
- index.html
- manifest.json
- sw.js
- assets/app.css
- assets/app.js
- assets/data.js
- icons/icon-192.png
- icons/icon-512.png

## GitHub Pages

Settings → Pages → Deploy from branch → main → / (root).

## Important

If you previously installed an older version of this app, unregister the old service worker once:
Chrome DevTools → Application → Service Workers → Unregister
then Application → Storage → Clear site data.
After that reload the website.

The timetable is stored in assets/data.js.
Attendance and notes are stored locally in the browser.
