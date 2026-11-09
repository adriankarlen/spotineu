#!/usr/bin/env bash
# Screenshot the running Spotify client through its DevTools (CDP) port with agent-browser.
#   scripts/snap.sh <name> [route]
#     name   file name without extension; saved to .screenshots/<name>.png
#     route  optional Spotify route to open first, e.g. / , /search , /collection/tracks ,
#            /playlist/<id> , /album/<id> , /artist/<id> , /preferences
# Needs Spotify started with --remote-debugging-port=9222 (spicetify watch -s does this).
set -euo pipefail

PORT="${SPOTIFY_CDP_PORT:-9222}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/.screenshots"
NAME="${1:?usage: scripts/snap.sh <name> [route]}"
ROUTE="${2:-}"
SESSION="spotineu"

if ! curl -s --max-time 2 "http://localhost:$PORT/json/list" | grep -q spotify; then
  echo "✖ No Spotify DevTools target on port $PORT." >&2
  echo "  Start live mode: nohup spicetify watch -s > /tmp/spotineu-watch.log 2>&1 &" >&2
  exit 2
fi

mkdir -p "$OUT"
ab() { agent-browser --session "$SESSION" "$@"; }

# Connect (idempotent) and make sure the main xpui page is the active target.
ab connect "$PORT" >/dev/null
if ! ab get url 2>/dev/null | grep -q xpui; then
  t="$(ab tab 2>/dev/null | grep xpui | grep -o '\[t[0-9]*\]' | tr -d '[]' | head -1)"
  [ -n "$t" ] && ab tab "$t" >/dev/null
fi
if ! ab eval 'typeof Spicetify' 2>/dev/null | grep -q object; then
  echo "✖ Connected, but the page has no Spicetify object. Spotify is running unpatched files:" >&2
  echo "  run 'spicetify backup apply', quit Spotify, then start watch mode again." >&2
  exit 3
fi

if [ -n "$ROUTE" ]; then
  ab eval "Spicetify.Platform.History.push('$ROUTE')" >/dev/null
  ab wait 1500 >/dev/null
fi

ab screenshot "$OUT/$NAME.png" >/dev/null
echo "$OUT/$NAME.png"
