# donrwalsh.com

Personal site served by nginx. Static HTML/CSS/JS with no build step.

## Local dev

Open `index.html` directly in a browser — no server needed for most pages. Run a local server only when testing absolute paths (e.g. `/resume.pdf` links) or to match nginx behavior more closely:

```bash
npx serve -p 4200 .
```

## Resume

`resume.pdf` is committed to the repo and served at `/resume.pdf`. It's generated elsewhere — replace the file to update it.

## Deployment

Single-stage Docker build. The nginx container serves everything in the repo root directly. No server-side logic; the fantasy football stats fetch (`scripts/fetch-ff-stats.sh`) runs once at container start via `docker-entrypoint.d`.

```bash
docker build -t donrwalsh-com .
docker run -p 8080:80 donrwalsh-com
```
