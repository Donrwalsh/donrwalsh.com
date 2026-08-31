# STEAM_API_KEY is intentionally never an ARG/ENV in this file — Coolify
# has no working build-time secret path here (BuildKit --mount=type=secret
# isn't wired up, and a plain ARG trips its build-check lint gate:
# SecretsUsedInArgOrEnv). Instead the Steam fetch runs at container start,
# reading STEAM_API_KEY as a normal runtime env var set in Coolify's
# Environment Variables tab. See docker/40-fetch-ff-stats.sh.

FROM nginx:alpine
RUN apk add --no-cache bash curl jq

COPY . /usr/share/nginx/html

COPY scripts/fetch-ff-stats.sh scripts/ff-games.json /opt/ff-tracker/
COPY docker/40-fetch-ff-stats.sh /docker-entrypoint.d/40-fetch-ff-stats.sh
RUN chmod +x /opt/ff-tracker/fetch-ff-stats.sh /docker-entrypoint.d/40-fetch-ff-stats.sh
