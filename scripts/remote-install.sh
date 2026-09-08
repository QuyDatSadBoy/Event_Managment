#!/usr/bin/env bash
# ===========================================================================
# Runs ON THE SERVER. Uploaded and invoked by scripts/deploy.sh, which passes
# every setting through the environment file next to it.
#
# Keeping this in its own file means no nested here-documents, so nothing gets
# expanded on the wrong machine.
#
#   remote-install.sh provision   install missing packages
#   remote-install.sh database    create the role and database
#   remote-install.sh install     unpack a release and point `current` at it
#   remote-install.sh services    write the pm2 config and (re)start
#   remote-install.sh nginx       write and enable the site
#   remote-install.sh verify      probe every endpoint
#   remote-install.sh preflight   check the box can host this
# ===========================================================================
set -Eeuo pipefail

CONF="${REMOTE_CONF:-/tmp/event-deploy.env}"
[ -f "$CONF" ] || { echo "missing $CONF"; exit 1; }
# shellcheck disable=SC1090
set -a; . "$CONF"; set +a

: "${APP_DIR:?}" "${APP_NAME:?}" "${DOMAIN:?}" "${API_PORT:?}" "${WEB_PORT:?}"

GRN=$'\e[32m'; RED=$'\e[31m'; YLW=$'\e[33m'; RST=$'\e[0m'
say()  { printf '    %s\n' "$*"; }
ok()   { printf '    %s✓%s %s\n' "$GRN" "$RST" "$*"; }
warn() { printf '    %s!%s %s\n' "$YLW" "$RST" "$*"; }
bad()  { printf '    %s✗%s %s\n' "$RED" "$RST" "$*"; }

have() { command -v "$1" >/dev/null 2>&1; }

# --------------------------------------------------------------------------
cmd_provision() {
  export DEBIAN_FRONTEND=noninteractive
  local need_update=false
  for c in curl rsync nginx psql; do have "$c" || need_update=true; done
  $need_update && apt-get update -qq

  have curl  || apt-get install -y -qq curl ca-certificates
  have rsync || apt-get install -y -qq rsync
  have nginx || apt-get install -y -qq nginx

  if ! have psql; then
    apt-get install -y -qq postgresql postgresql-contrib
    systemctl enable --now postgresql
  fi

  local major=0
  have node && major="$(node -v | sed 's/^v//' | cut -d. -f1)"
  if [ "$major" -lt "${NODE_MAJOR:-22}" ]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR:-22}.x" | bash - >/dev/null
    apt-get install -y -qq nodejs
  fi

  have pm2 || npm install -g pm2 >/dev/null

  say "node   $(node -v)"
  say "nginx  $(nginx -v 2>&1 | sed 's|nginx version: ||')"
  say "psql   $(psql --version | awk '{print $3}')"
  say "pm2    $(pm2 -v)"
}

# --------------------------------------------------------------------------
cmd_preflight() {
  local missing=""
  for c in node npm pm2 nginx psql; do have "$c" || missing="$missing $c"; done
  if [ -n "$missing" ]; then
    bad "missing on server:$missing"
    say "run: ./scripts/deploy.sh --provision"
    exit 3
  fi

  # A port held by something other than this app is a hard stop. Ownership is
  # decided by PID against our own pm2 processes, not by the truncated command
  # name that `ss` prints.
  local ours p holder_pid holder_cmd
  ours=$(pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const prefix = process.argv[1] + "-";
      const pids = [];
      for (const a of JSON.parse(s || "[]")) {
        if (a.name && a.name.startsWith(prefix) && a.pid) pids.push(a.pid);
      }
      console.log(pids.join(" "));
    });
  ' "$APP_NAME" 2>/dev/null || true)

  for p in "$API_PORT" "$WEB_PORT"; do
    holder_pid=$(ss -tlnpH "sport = :$p" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | head -1 || true)
    [ -n "$holder_pid" ] || continue
    if printf ' %s ' "$ours" | grep -q " $holder_pid "; then
      say "port $p held by this app (pid $holder_pid) — will be reloaded"
      continue
    fi
    holder_cmd=$(ps -p "$holder_pid" -o args= 2>/dev/null | cut -c1-70)
    bad "port $p already used by pid $holder_pid: $holder_cmd"
    say "change API_PORT/WEB_PORT in deploy/deploy.env, or stop that process"
    exit 4
  done

  [ -f "$SSL_CERT" ] || { bad "TLS certificate not found: $SSL_CERT"; exit 5; }
  [ -f "$SSL_KEY" ]  || { bad "TLS key not found: $SSL_KEY"; exit 5; }

  free -m | awk '/^Mem:/ {printf "    memory available: %s MB of %s MB\n", $7, $2}'
  df -h / | awk 'NR==2 {printf "    disk free: %s of %s\n", $4, $2}'

  local avail
  avail=$(free -m | awk '/^Mem:/ {print $7}')
  [ "$avail" -lt 500 ] && warn "under 500 MB free — the web process may be restarted by pm2 under load"
  return 0
}

# --------------------------------------------------------------------------
cmd_database() {
  local as_pg="sudo -u postgres psql -v ON_ERROR_STOP=1 -tAc"

  if [ "$($as_pg "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'")" != "1" ]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 \
      -c "CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASSWORD}'" >/dev/null
    ok "created role ${DB_USER}"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 \
      -c "ALTER ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASSWORD}'" >/dev/null
    say "role ${DB_USER} exists (password synced)"
  fi

  if [ "$($as_pg "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")" != "1" ]; then
    sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
    ok "created database ${DB_NAME}"
  else
    say "database ${DB_NAME} exists"
  fi

  # gen_random_uuid() lives in pgcrypto, and installing it needs superuser.
  sudo -u postgres psql -q -d "${DB_NAME}" -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto"' >/dev/null
  sudo -u postgres psql -q -d "${DB_NAME}" \
    -c "GRANT ALL ON SCHEMA public TO \"${DB_USER}\"" >/dev/null
}

# --------------------------------------------------------------------------
cmd_install() {
  : "${RELEASE:?RELEASE not set}"
  local rel="$APP_DIR/releases/$RELEASE"

  mkdir -p "$APP_DIR/releases" "$APP_DIR/shared/uploads" "$APP_DIR/logs"
  rm -rf "$rel"; mkdir -p "$rel"
  tar -xzf "$APP_DIR/releases/$RELEASE.tar.gz" -C "$rel"
  rm -f "$APP_DIR/releases/$RELEASE.tar.gz"

  # Uploaded media lives outside the release so it survives every deploy.
  rm -rf "$rel/backend/uploads"
  ln -sfn "$APP_DIR/shared/uploads" "$rel/backend/uploads"
  chmod +x "$rel/backend/event-api"

  umask 077
  cat > "$APP_DIR/shared/api.env" <<ENV
APP_ENV=production
PORT=${API_PORT}
DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY_HOURS=168
UPLOAD_DIR=${APP_DIR}/shared/uploads
PUBLIC_BASE_URL=https://${DOMAIN}
ALLOWED_ORIGINS=https://${DOMAIN}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
MAX_UPLOAD_MB=25
APP_TIMEZONE=${APP_TIMEZONE}
TZ=${APP_TIMEZONE}
ENV
  umask 022

  # pm2's env_file is not honoured by every version, so the API is launched
  # through a wrapper that sources the secrets itself and then execs the binary
  # (same PID, so pm2 still supervises and enforces max_memory_restart).
  cat > "$rel/backend/run-api.sh" <<RUNNER
#!/usr/bin/env bash
# Generated per release. Paths are absolute so this does not depend on the
# working directory pm2 happens to use, or on how the \`current\` symlink resolves.
set -Eeuo pipefail
set -a
# shellcheck disable=SC1091
. "${APP_DIR}/shared/api.env"
set +a
exec "${rel}/backend/event-api"
RUNNER
  chmod 700 "$rel/backend/run-api.sh"

  ln -sfn "$rel" "$APP_DIR/current"

  # Keep the three most recent releases for a quick rollback.
  # shellcheck disable=SC2012
  ls -1dt "$APP_DIR/releases"/*/ 2>/dev/null | tail -n +4 | xargs -r rm -rf
  ok "release $RELEASE is current"
}

# --------------------------------------------------------------------------
cmd_migrate() {
  set -a; . "$APP_DIR/shared/api.env"; set +a
  "$APP_DIR/current/backend/event-api" -migrate
}

cmd_seed() {
  set -a; . "$APP_DIR/shared/api.env"; set +a
  "$APP_DIR/current/backend/event-api" -seed
}

# --------------------------------------------------------------------------
cmd_services() {
  cat > "$APP_DIR/ecosystem.config.js" <<ECO
// Generated by scripts/deploy.sh — change deploy/deploy.env, not this file.
module.exports = {
  apps: [
    {
      name: "${APP_NAME}-api",
      script: "${APP_DIR}/current/backend/run-api.sh",
      interpreter: "bash",
      cwd: "${APP_DIR}/current/backend",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "220M",
      out_file: "${APP_DIR}/logs/api-out.log",
      error_file: "${APP_DIR}/logs/api-err.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "${APP_NAME}-web",
      script: "${APP_DIR}/current/frontend/server.js",
      cwd: "${APP_DIR}/current/frontend",
      instances: 1,
      exec_mode: "fork",
      // A single worker with a capped heap: this box has other tenants.
      // Headroom above the ~140 MB steady state so a traffic burst does not
      // trip max_memory_restart and turn into a 502.
      max_memory_restart: "560M",
      node_args: "--max-old-space-size=480",
      env: {
        NODE_ENV: "production",
        PORT: "${WEB_PORT}",
        HOSTNAME: "127.0.0.1",
        API_INTERNAL_URL: "http://127.0.0.1:${API_PORT}",
        NEXT_PUBLIC_API_URL: "https://${DOMAIN}",
        NEXT_PUBLIC_SITE_URL: "https://${DOMAIN}",
        TZ: "${APP_TIMEZONE}",
      },
      out_file: "${APP_DIR}/logs/web-out.log",
      error_file: "${APP_DIR}/logs/web-err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
ECO

  chmod 600 "$APP_DIR/ecosystem.config.js"

  # `pm2 startOrReload` keeps the definition it already has, so a changed script
  # path (or interpreter) would silently keep running the old one. Drop any app
  # whose recorded exec path no longer matches before reloading.
  local want_api="$APP_DIR/current/backend/run-api.sh"
  local want_web="$APP_DIR/current/frontend/server.js"
  local stale
  stale=$(pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const [prefix, api, web] = process.argv.slice(1);
      const want = { [prefix + "-api"]: api, [prefix + "-web"]: web };
      const out = [];
      for (const a of JSON.parse(s || "[]")) {
        const expected = want[a.name];
        if (expected && a.pm2_env && a.pm2_env.pm_exec_path !== expected) out.push(a.name);
      }
      console.log(out.join(" "));
    });
  ' "$APP_NAME" "$want_api" "$want_web" 2>/dev/null || true)

  if [ -n "$stale" ]; then
    say "process definition changed, recreating:$stale"
    # shellcheck disable=SC2086
    pm2 delete $stale >/dev/null 2>&1 || true
  fi

  pm2 startOrReload "$APP_DIR/ecosystem.config.js" --update-env
  pm2 save >/dev/null
  pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
}

# --------------------------------------------------------------------------
cmd_nginx() {
  local site="/etc/nginx/sites-available/${APP_NAME}-${DOMAIN}"

  # The standalone `http2 on;` directive only exists from nginx 1.25.1; older
  # builds (Ubuntu 24.04 ships 1.24) take the flag on the listen line instead.
  local ver listen_ssl
  ver=$(nginx -v 2>&1 | sed 's|.*/||')
  if [ "$(printf '%s\n1.25.1\n' "$ver" | sort -V | head -1)" = "1.25.1" ]; then
    listen_ssl=$'listen 443 ssl;\n    http2 on;'
  else
    listen_ssl="listen 443 ssl http2;"
  fi
  cat > "$site" <<NGINX
# ${DOMAIN} — generated by scripts/deploy.sh
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    ${listen_ssl}
    server_name ${DOMAIN};

    ssl_certificate     ${SSL_CERT};
    ssl_certificate_key ${SSL_KEY};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL_${APP_NAME}:5m;
    ssl_session_timeout 1h;

    include /etc/nginx/snippets/vhd-cloudflare-realip.conf;

    # Matches MAX_UPLOAD_MB in the API, with room for multipart overhead.
    client_max_body_size 30m;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml application/rss+xml;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Build assets are content-hashed, so they can be cached forever.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_set_header Host \$host;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Uploaded media is served by the Go process out of the shared directory.
    location /uploads/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
        access_log off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header CF-Connecting-IP \$http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }

    location = /health {
        proxy_pass http://127.0.0.1:${API_PORT}/health;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header CF-Connecting-IP \$http_cf_connecting_ip;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX

  # The Cloudflare real-ip snippet is site-specific; drop the include if absent.
  [ -f /etc/nginx/snippets/vhd-cloudflare-realip.conf ] || \
    sed -i '/vhd-cloudflare-realip/d' "$site"

  ln -sfn "$site" "/etc/nginx/sites-enabled/$(basename "$site")"
  nginx -t
  systemctl reload nginx
}

# --------------------------------------------------------------------------
cmd_verify() {
  local fail=0
  probe() {
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$2" 2>/dev/null || true)
    [ -n "$code" ] || code="000"
    if [ "$code" = "$3" ]; then
      printf '    %s✓%s %-24s %s\n' "$GRN" "$RST" "$1" "$code"
    else
      printf '    %s✗%s %-24s %s (expected %s)\n' "$RED" "$RST" "$1" "$code" "$3"
      fail=1
    fi
  }
  probe "api health"      "http://127.0.0.1:${API_PORT}/health"      200
  probe "api settings"    "http://127.0.0.1:${API_PORT}/api/settings" 200
  probe "api home bundle" "http://127.0.0.1:${API_PORT}/api/home"     200
  probe "web home"        "http://127.0.0.1:${WEB_PORT}/"             200
  probe "web admin login" "http://127.0.0.1:${WEB_PORT}/admin/login"  200
  # Resolve the hostname to this box so the vhost is exercised even before the
  # DNS record exists; -k because the origin certificate is Cloudflare's.
  local nginx_code
  nginx_code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 \
    --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/health" 2>/dev/null || true)
  if [ "$nginx_code" = "200" ]; then
    printf '    %s✓%s %-24s %s\n' "$GRN" "$RST" "nginx vhost" "$nginx_code"
  else
    printf '    %s✗%s %-24s %s (expected 200)\n' "$RED" "$RST" "nginx vhost" "${nginx_code:-000}"
    fail=1
  fi

  # Public DNS may not point here yet; report it without failing the deploy.
  local public_code
  public_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 \
    "https://${DOMAIN}/health" 2>/dev/null || true)
  if [ "$public_code" = "200" ]; then
    printf '    %s✓%s %-24s %s\n' "$GRN" "$RST" "public DNS" "$public_code"
  else
    printf '    %s!%s %-24s not resolving yet — add the Cloudflare record\n' \
      "$YLW" "$RST" "public DNS"
  fi

  echo
  pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const prefix = process.argv[1] + "-";
      for (const p of JSON.parse(s)) {
        if (!p.name.startsWith(prefix)) continue;
        const mb = (p.monit.memory / 1048576).toFixed(0);
        console.log(
          "    " + p.name.padEnd(16) + p.pm2_env.status.padEnd(10) +
          (mb + " MB").padEnd(10) + "restarts: " + p.pm2_env.restart_time,
        );
      }
    });
  ' "$APP_NAME"

  return $fail
}

# --------------------------------------------------------------------------
case "${1:-}" in
  provision) cmd_provision ;;
  preflight) cmd_preflight ;;
  database)  cmd_database ;;
  install)   cmd_install ;;
  migrate)   cmd_migrate ;;
  seed)      cmd_seed ;;
  services)  cmd_services ;;
  nginx)     cmd_nginx ;;
  verify)    cmd_verify ;;
  *) echo "usage: $0 {provision|preflight|database|install|migrate|seed|services|nginx|verify}"; exit 1 ;;
esac
