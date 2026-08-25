# --- stage 1: fetch fresh Steam achievement data at build time ---
FROM alpine:3.20 AS ff-data
RUN apk add --no-cache bash curl jq
WORKDIR /build
COPY scripts/fetch-ff-stats.sh scripts/ff-games.json ./
ARG STEAM_ID=76561198054967504
RUN --mount=type=secret,id=steam_api_key \
    STEAM_API_KEY="$(cat /run/secrets/steam_api_key)" \
    STEAM_ID="${STEAM_ID}" \
    bash fetch-ff-stats.sh ff-games.json > ff-progress.json

# --- stage 2: static site, served as-is ---
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY --from=ff-data /build/ff-progress.json /usr/share/nginx/html/data/ff-progress.json
