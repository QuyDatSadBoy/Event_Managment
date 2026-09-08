#!/usr/bin/env bash
# ===========================================================================
# Event Management — one-command deploy.
#
#   ./scripts/deploy.sh                 build + deploy
#   ./scripts/deploy.sh --provision     install missing server packages first
#   ./scripts/deploy.sh --seed          also insert the demo content
#   ./scripts/deploy.sh --skip-build    reuse the artifacts already in dist/
#   ./scripts/deploy.sh --status        show service status and exit
#   ./scripts/deploy.sh --logs          tail the running services and exit
#   ./scripts/deploy.sh --rollback      switch back to the previous release
#
# Both artifacts are compiled here — a static Go binary and Next.js in
# standalone mode — so the server never needs a toolchain. That is what keeps
# a deploy under a minute on a 2-core VPS.
#
# Moving to a new VPS: edit deploy/deploy.env, then run with --provision.
# ===========================================================================
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------- output ---
if [[ -t 1 ]]; then
  BOLD=$'\e[1m'; DIM=$'\e[2m'; RED=$'\e[31m'; GRN=$'\e[32m'
  YLW=$'\e[33m'; BLU=$'\e[34m'; RST=$'\e[0m'
else
  BOLD=""; DIM=""; RED=""; GRN=""; YLW=""; BLU=""; RST=""
fi
step() { printf '\n%s==>%s %s%s%s\n' "$BLU" "$RST" "$BOLD" "$*" "$RST"; }
info() { printf '    %s\n' "$*"; }
ok()   { printf '    %s✓%s %s\n' "$GRN" "$RST" "$*"; }
warn() { printf '    %s!%s %s\n' "$YLW" "$RST" "$*"; }
die()  { printf '\n%serror:%s %s\n\n' "$RED" "$RST" "$*" >&2; exit 1; }
trap 'die "deploy failed at line $LINENO"' ERR

# ---------------------------------------------------------------- config ---
ENV_FILE="$ROOT/deploy/deploy.env"
[[ -f "$ENV_FILE" ]] || die "missing deploy/deploy.env — copy deploy/deploy.env.example and fill it in"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${SSH_HOST:?set SSH_HOST in deploy/deploy.env}"
: "${DOMAIN:?set DOMAIN in deploy/deploy.env}"

SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
APP_DIR="${APP_DIR:-/root/event-mgmt}"
APP_NAME="${APP_NAME:-event}"
APP_TIMEZONE="${APP_TIMEZONE:-Asia/Ho_Chi_Minh}"
API_PORT="${API_PORT:-8090}"
WEB_PORT="${WEB_PORT:-3002}"
DB_NAME="${DB_NAME:-event_db}"
DB_USER="${DB_USER:-event_user}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
SSL_CERT="${SSL_CERT:-/etc/nginx/ssl/origin.crt}"
SSL_KEY="${SSL_KEY:-/etc/nginx/ssl/origin.key}"
SEED_DEMO="${SEED_DEMO:-false}"
NODE_MAJOR="${NODE_MAJOR:-22}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN#*.}}"

for v in DB_PASSWORD JWT_SECRET ADMIN_PASSWORD; do
  [[ -z "${!v:-}" ]] && die "$v is empty in deploy/deploy.env"
  [[ "${!v}" == CHANGE_ME* ]] && die "$v is still a placeholder in deploy/deploy.env"
done
[[ ${#JWT_SECRET} -ge 24 ]] || die "JWT_SECRET should be at least 24 characters"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o ServerAliveInterval=30)
SCP_OPTS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
SSH_OPTS+=(-p "$SSH_PORT")
SCP_OPTS+=(-P "$SSH_PORT")
if [[ -n "${SSH_KEY:-}" ]]; then
  KEY_PATH="${SSH_KEY/#\~/$HOME}"
  [[ -f "$KEY_PATH" ]] || die "SSH_KEY not found: $KEY_PATH"
  SSH_OPTS+=(-i "$KEY_PATH")
  SCP_OPTS+=(-i "$KEY_PATH")
fi
TARGET="$SSH_USER@$SSH_HOST"
REMOTE_CONF="/tmp/${APP_NAME}-deploy.env"
REMOTE_SCRIPT="/tmp/${APP_NAME}-remote-install.sh"

remote()  { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }
rrun()    { ssh "${SSH_OPTS[@]}" "$TARGET" "REMOTE_CONF='$REMOTE_CONF' bash '$REMOTE_SCRIPT' $*"; }

# ---------------------------------------------------------------- flags ----
DO_PROVISION=false; DO_SEED=false; SKIP_BUILD=false; ACTION=deploy
while [[ $# -gt 0 ]]; do
  case "$1" in
    --provision)  DO_PROVISION=true ;;
    --seed)       DO_SEED=true ;;
    --skip-build) SKIP_BUILD=true ;;
    --status)     ACTION=status ;;
    --logs)       ACTION=logs ;;
    --rollback)   ACTION=rollback ;;
    -h|--help)    sed -n '3,17p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            die "unknown option: $1" ;;
  esac
  shift
done
[[ "$SEED_DEMO" == "true" ]] && DO_SEED=true

# ------------------------------------------------------------- shortcuts ---
case "$ACTION" in
  logs)
    remote "pm2 logs ${APP_NAME}-api ${APP_NAME}-web --lines 80"
    exit 0 ;;
  status)
    remote "pm2 list; echo; \
      printf 'api : %s\n' \"\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${API_PORT}/health)\"; \
      printf 'web : %s\n' \"\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${WEB_PORT}/)\""
    exit 0 ;;
  rollback)
    step "Rolling back to the previous release"
    remote "set -e
      prev=\$(ls -1dt '$APP_DIR/releases'/*/ 2>/dev/null | sed -n 2p)
      [ -n \"\$prev\" ] || { echo 'no previous release to roll back to'; exit 1; }
      ln -sfn \"\${prev%/}\" '$APP_DIR/current'
      pm2 reload '$APP_DIR/ecosystem.config.js' --update-env
      echo \"now serving \$(basename \"\${prev%/}\")\""
    ok "rolled back"
    exit 0 ;;
esac

printf '%sEvent Management — deploy%s\n' "$BOLD" "$RST"
info "target  ${TARGET}:${SSH_PORT}"
info "site    https://${DOMAIN}"
info "dir     ${APP_DIR}"

# ================================================================ BUILD ====
DIST="$ROOT/dist"
ARCHIVE="$ROOT/dist.tar.gz"

if [[ "$SKIP_BUILD" == false ]]; then
  step "Building API (Go → static linux/amd64)"
  command -v go >/dev/null || die "go is not installed locally"
  rm -rf "$DIST"; mkdir -p "$DIST/backend" "$DIST/frontend"
  ( cd "$ROOT/backend"
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
      go build -trimpath -ldflags="-s -w" -o "$DIST/backend/event-api" ./cmd/server )
  ok "$(du -h "$DIST/backend/event-api" | cut -f1) binary"

  step "Building site (Next.js → standalone)"
  command -v npm >/dev/null || die "npm is not installed locally"
  ( cd "$ROOT/frontend"
    [[ -d node_modules ]] || npm ci --no-audit --no-fund
    NEXT_PUBLIC_API_URL="https://${DOMAIN}" \
    NEXT_PUBLIC_SITE_URL="https://${DOMAIN}" \
    API_INTERNAL_URL="http://127.0.0.1:${API_PORT}" \
      npm run build >/dev/null )

  # Standalone brings its own trimmed node_modules but not the static assets.
  cp -r "$ROOT/frontend/.next/standalone/." "$DIST/frontend/"
  mkdir -p "$DIST/frontend/.next"
  cp -r "$ROOT/frontend/.next/static" "$DIST/frontend/.next/static"
  if [[ -d "$ROOT/frontend/public" ]]; then
    mkdir -p "$DIST/frontend/public"
    cp -r "$ROOT/frontend/public/." "$DIST/frontend/public/"
  fi
  [[ -f "$DIST/frontend/server.js" ]] || die "standalone build produced no server.js"
  ok "$(du -sh "$DIST/frontend" | cut -f1) standalone bundle"

  step "Packing"
  tar -C "$DIST" -czf "$ARCHIVE" backend frontend
  ok "$(du -h "$ARCHIVE" | cut -f1) archive"
else
  [[ -f "$ARCHIVE" ]] || die "--skip-build given but $ARCHIVE is missing"
  warn "reusing $(du -h "$ARCHIVE" | cut -f1) archive from a previous build"
fi

# ========================================================= SEND CONFIG ====
step "Connecting"
remote "true" || die "cannot reach $TARGET over SSH"

# The config lands in /tmp with 600 so the secrets are not world-readable.
CONF_TMP="$(mktemp)"
trap 'rm -f "$CONF_TMP"' EXIT
cat > "$CONF_TMP" <<CONF
APP_DIR='${APP_DIR}'
APP_NAME='${APP_NAME}'
APP_TIMEZONE='${APP_TIMEZONE}'
DOMAIN='${DOMAIN}'
API_PORT='${API_PORT}'
WEB_PORT='${WEB_PORT}'
DB_NAME='${DB_NAME}'
DB_USER='${DB_USER}'
DB_PASSWORD='${DB_PASSWORD}'
DB_HOST='${DB_HOST}'
DB_PORT='${DB_PORT}'
JWT_SECRET='${JWT_SECRET}'
ADMIN_EMAIL='${ADMIN_EMAIL}'
ADMIN_PASSWORD='${ADMIN_PASSWORD}'
SSL_CERT='${SSL_CERT}'
SSL_KEY='${SSL_KEY}'
NODE_MAJOR='${NODE_MAJOR}'
CONF
scp "${SCP_OPTS[@]}" -q "$CONF_TMP" "$TARGET:$REMOTE_CONF"
scp "${SCP_OPTS[@]}" -q "$ROOT/scripts/remote-install.sh" "$TARGET:$REMOTE_SCRIPT"
remote "chmod 600 '$REMOTE_CONF'; chmod 700 '$REMOTE_SCRIPT'"
ok "connected"

# ============================================================ PROVISION ====
if [[ "$DO_PROVISION" == true ]]; then
  step "Provisioning server packages"
  rrun provision
  ok "packages ready"
fi

step "Checking server"
rrun preflight
ok "server can host this"

step "Ensuring database"
rrun database
ok "database ready"

# ============================================================== SHIP =======
step "Uploading release"
RELEASE="$(date +%Y%m%d-%H%M%S)"
remote "mkdir -p '$APP_DIR/releases' '$APP_DIR/shared/uploads' '$APP_DIR/logs'"
scp "${SCP_OPTS[@]}" -q "$ARCHIVE" "$TARGET:$APP_DIR/releases/$RELEASE.tar.gz"
ok "release $RELEASE uploaded"

step "Installing release"
remote "REMOTE_CONF='$REMOTE_CONF' RELEASE='$RELEASE' bash '$REMOTE_SCRIPT' install"

step "Running migrations"
rrun migrate
ok "schema up to date"

if [[ "$DO_SEED" == true ]]; then
  step "Seeding demo content"
  info "tables that already contain rows are left untouched"
  rrun seed
  ok "content ready"
fi

step "Starting services"
rrun services
ok "pm2 reloaded"

step "Configuring nginx"
rrun nginx
ok "serving ${DOMAIN}"

step "Verifying"
sleep 3
if rrun verify; then
  ok "all checks passed"
else
  warn "some checks failed — see ./scripts/deploy.sh --logs"
fi

remote "rm -f '$REMOTE_CONF'"

printf '\n%s✓ Deployed%s   https://%s\n' "$GRN" "$RST" "$DOMAIN"
printf '%s  admin  %s https://%s/admin   (%s)\n' "$DIM" "$RST" "$DOMAIN" "$ADMIN_EMAIL"
printf '%s  logs   %s ./scripts/deploy.sh --logs\n' "$DIM" "$RST"
printf '%s  status %s ./scripts/deploy.sh --status\n\n' "$DIM" "$RST"
