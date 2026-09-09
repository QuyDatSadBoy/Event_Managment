#!/usr/bin/env bash
# ===========================================================================
# Build the frontend and serve the real production artifact on :3002.
#
# Three things this exists to prevent, each of which cost a debugging round:
#   * piping `npm run build` into `head` sends SIGPIPE and kills the build
#     midway, leaving a standalone bundle with no CSS;
#   * `next build` recreates .next/standalone, so the static assets have to be
#     copied in afterwards, every time;
#   * starting the server while a dev server still holds :3002 silently leaves
#     the old process serving, and every measurement then describes dev.
# ===========================================================================
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE="$ROOT/frontend"
PORT="${PORT:-3002}"
API_PORT="${API_PORT:-8090}"
LOG="${LOG:-/tmp/event-web-$PORT.log}"

cd "$FE"

if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> building"
  npm run build > /tmp/event-build.log 2>&1 || { tail -30 /tmp/event-build.log; exit 1; }
  grep -E "✓ Compiled" /tmp/event-build.log | tail -1
fi

echo "==> staging standalone assets"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
[[ -d public ]] && mkdir -p .next/standalone/public && cp -r public/. .next/standalone/public/
css_count=$(find .next/standalone/.next/static -name '*.css' | wc -l)
[[ "$css_count" -gt 0 ]] || { echo "no CSS in the standalone bundle — the build did not finish"; exit 1; }
echo "    $css_count stylesheet(s) staged"

echo "==> freeing :$PORT"
for _ in 1 2 3; do
  pid=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
  [[ -z "$pid" ]] && break
  kill "$pid" 2>/dev/null || true
  sleep 2
done
pid=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
[[ -n "$pid" ]] && { kill -9 "$pid" 2>/dev/null || true; sleep 1; }

echo "==> starting"
cd .next/standalone
PORT="$PORT" HOSTNAME=127.0.0.1 NODE_ENV=production \
  NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" \
  API_INTERNAL_URL="http://127.0.0.1:$API_PORT" \
  setsid nohup node server.js > "$LOG" 2>&1 < /dev/null &
disown 2>/dev/null || true

for _ in $(seq 1 30); do
  curl -sf -o /dev/null "http://localhost:$PORT/" && break
  sleep 1
done

# The two failure modes worth asserting on, not eyeballing.
html=$(curl -s "http://localhost:$PORT/")
if grep -q "hmr-client\|next-devtools" <<< "$html"; then
  echo "still serving a dev build on :$PORT"; exit 1
fi
css_href=$(grep -oP '/_next/static/[^"]+\.css' <<< "$html" | head -1)
css_code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT$css_href")
[[ "$css_code" == "200" ]] || { echo "stylesheet $css_href returned $css_code"; exit 1; }

echo "==> production build serving on http://localhost:$PORT  (css $css_code)"
