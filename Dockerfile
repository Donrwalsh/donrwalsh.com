# --- stage 1: fetch fresh Steam achievement data at build time ---
FROM alpine:3.20 AS ff-data
RUN apk add --no-cache bash curl jq
WORKDIR /build
COPY scripts/fetch-ff-stats.sh scripts/ff-games.json ./
ARG STEAM_ID=76561198054967504
# Plain build ARG rather than a BuildKit --secret mount: Coolify's build
# doesn't supply the latter (confirmed — the RUN below failed with
# "/run/secrets/steam_api_key: No such file or directory" when it did).
# This stage is discarded after the build (see stage 2's COPY --from),
# so the key never reaches the shipped image's layers or `docker
# history` — only this intermediate stage's own layer cache carries it.
ARG STEAM_API_KEY
RUN STEAM_API_KEY="${STEAM_API_KEY}" \
    STEAM_ID="${STEAM_ID}" \
    bash fetch-ff-stats.sh ff-games.json > ff-progress.json

# --- stage 2: static site, served as-is ---
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY --from=ff-data /build/ff-progress.json /usr/share/nginx/html/data/ff-progress.json
