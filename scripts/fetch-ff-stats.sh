#!/usr/bin/env bash
# Fetches Steam achievement progress for every game in ff-games.json and
# prints one consolidated JSON document (see data/ff-progress.json for the
# shape) to stdout. Run at Docker build time — never ships STEAM_API_KEY
# into the final image.
set -euo pipefail

: "${STEAM_API_KEY:?STEAM_API_KEY not set}"
: "${STEAM_ID:?STEAM_ID not set}"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
manifest="${1:-$script_dir/ff-games.json}"

games="[]"

while IFS= read -r entry; do
  key=$(jq -r '.key' <<< "$entry")
  appid=$(jq -r '.app_id' <<< "$entry")

  player=$(curl -sf "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${STEAM_ID}" || echo '{}')
  schema=$(curl -sf "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appid}" || echo '{}')

  game_json=$(jq -c \
    --argjson player "$player" \
    --argjson schema "$schema" \
    --arg key "$key" \
    --argjson appid "$appid" \
    '
    ($schema.game.availableGameStats.achievements // []) as $sch
    | ($player.playerstats.achievements // [] | map({(.apiname): .achieved}) | add // {}) as $plmap
    | ($schema.game.gameName // $key) as $gname
    | {
        key: $key,
        app_id: $appid,
        name: $gname,
        platform: "Steam",
        achievements: [
          $sch[] | { id: .name, name: (.displayName // .name), unlocked: (($plmap[.name] // 0) == 1) }
        ]
      }
    | .unlocked = ([.achievements[] | select(.unlocked)] | length)
    | .total = (.achievements | length)
    | .percent = (if .total > 0 then (((.unlocked * 100) / .total) | floor) else 0 end)
    ' <<< '{}')

  games=$(jq -c --argjson g "$game_json" '. + [$g]' <<< "$games")
done < <(jq -c '.[]' "$manifest")

jq -n \
  --arg generated_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg steam_id "$STEAM_ID" \
  --argjson games "$games" \
  '{ generated_at: $generated_at, steam_id: $steam_id, games: $games }'
