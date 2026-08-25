#!/bin/sh
# Runs automatically before nginx starts (nginx:alpine's stock entrypoint
# executes every *.sh in /docker-entrypoint.d/). Refreshes
# data/ff-progress.json from the Steam API using runtime env vars — never
# fails the container start, since a transient Steam API hiccup shouldn't
# take the whole site down. On any failure, whatever data/ff-progress.json
# already shipped in the image (the last successful fetch, or the
# committed sample fixture) keeps being served.
set -eu

STEAM_ID="${STEAM_ID:-76561198054967504}"

if [ -z "${STEAM_API_KEY:-}" ]; then
  echo "ff-tracker: STEAM_API_KEY not set — serving existing data/ff-progress.json." >&2
  exit 0
fi

if STEAM_API_KEY="$STEAM_API_KEY" STEAM_ID="$STEAM_ID" \
    bash /opt/ff-tracker/fetch-ff-stats.sh /opt/ff-tracker/ff-games.json \
    > /tmp/ff-progress.json.new 2> /tmp/ff-fetch.log; then
  mv /tmp/ff-progress.json.new /usr/share/nginx/html/data/ff-progress.json
  echo "ff-tracker: refreshed data/ff-progress.json from Steam." >&2
else
  echo "ff-tracker: Steam fetch failed, keeping existing data/ff-progress.json. Details:" >&2
  cat /tmp/ff-fetch.log >&2
fi
