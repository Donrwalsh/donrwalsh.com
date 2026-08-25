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
  date_override=$(jq -r '.release_date_override // ""' <<< "$entry")
  name_override=$(jq -r '.name_override // ""' <<< "$entry")
  note=$(jq -r '.note // ""' <<< "$entry")

  player=$(curl -sf "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=${appid}&key=${STEAM_API_KEY}&steamid=${STEAM_ID}" || echo '{}')
  schema=$(curl -sf "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appid}" || echo '{}')

  # The Steam Web API (above) carries no release date. The public Steam
  # Store API does, so pull it from there for sorting purposes. Sleep a
  # touch between calls — this endpoint throttles more aggressively than
  # the Web API and isn't meant for tight loops.
  store=$(curl -sf "https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=en" || echo '{}')
  sleep 1

  game_json=$(jq -c \
    --argjson player "$player" \
    --argjson schema "$schema" \
    --argjson store "$store" \
    --arg key "$key" \
    --argjson appid "$appid" \
    --arg date_override "$date_override" \
    --arg name_override "$name_override" \
    --arg note "$note" \
    '
    ($schema.game.availableGameStats.achievements // []) as $sch
    | ($player.playerstats.achievements // [] | map(select(.name != null) | {(.name): .achieved}) | add // {}) as $plmap
    | (if $name_override != "" then $name_override
       else ($store[$appid | tostring].data.name // $schema.game.gameName // $key)
       end) as $gname
    | ($store[$appid | tostring].data.release_date.date // "") as $raw_date
    | (if $date_override != "" then $date_override
       else (try ($raw_date | strptime("%b %d, %Y") | mktime | strftime("%Y-%m-%d")) catch null)
       end) as $release_date
    | {
        key: $key,
        app_id: $appid,
        name: $gname,
        platform: "Steam",
        release_date: $release_date,
        note: (if $note != "" then $note else null end),
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
