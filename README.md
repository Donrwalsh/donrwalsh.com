# donrwalsh.com

Personal site served by nginx. Static HTML/CSS/JS with no build step.

## Local dev

Open `index.html` directly in a browser — no server needed for most pages. Run a local server only when testing absolute paths (e.g. `/resume.pdf` links) or to match nginx behavior more closely:

```bash
npx serve -p 4200 .
```

## Resume

`resume.json` is the source of truth. Edit it, regenerate the PDF, then commit both.

```bash
npm install        # first time only
npm run export-resume
```

The PDF is committed to the repo and served at `/resume.pdf`. The theme lives in `theme/index.js` — edit it to change the PDF layout or styles.

## Deployment

Single-stage Docker build. The nginx container serves everything in the repo root directly. No server-side logic; the fantasy football stats fetch (`scripts/fetch-ff-stats.sh`) runs once at container start via `docker-entrypoint.d`.

```bash
docker build -t donrwalsh-com .
docker run -p 8080:80 donrwalsh-com
```
