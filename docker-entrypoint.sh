#!/bin/sh
set -e

echo "Injecting runtime configuration into index.html..."

CONTEXT_PATH_NORMALIZED="${CONTEXT_PATH%/}"

if [ -z "$CONTEXT_PATH_NORMALIZED" ]; then
  CONTEXT_PATH_NORMALIZED="/"
fi

# Create runtime config script
cat > /tmp/runtime-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  keycloakUrl: '${VITE_KEYCLOAK_URL}',
  keycloakRealm: '${VITE_KEYCLOAK_REALM}',
  keycloakClientId: '${VITE_KEYCLOAK_CLIENT_ID}',
  wisefoodApiUrl: '${VITE_WISEFOOD_API_URL}',
  wisefoodRestApiUrl: '${VITE_WISEFOOD_REST_API_URL}'
};
EOF

echo "Runtime configuration:"
cat /tmp/runtime-config.js

# Copy the config to nginx served directory first
cp /tmp/runtime-config.js /usr/share/nginx/html/runtime-config.js

# Mirror the built assets under the configured context path when needed.
# Nuxt emits files at the web root, while production serves the app from /app.
if [ "$CONTEXT_PATH_NORMALIZED" != "/" ]; then
  TARGET_DIR="/usr/share/nginx/html$CONTEXT_PATH_NORMALIZED"
  mkdir -p "$TARGET_DIR"

  for entry in /usr/share/nginx/html/*; do
    base="$(basename "$entry")"

    if [ "$base" = "$(basename "$CONTEXT_PATH_NORMALIZED")" ]; then
      continue
    fi

    ln -sfn "../$base" "$TARGET_DIR/$base"
  done
fi

# Inject the script reference into index.html in the head section
if [ "$CONTEXT_PATH_NORMALIZED" != "/" ]; then
  SCRIPT_SRC="$CONTEXT_PATH_NORMALIZED/runtime-config.js"
else
  SCRIPT_SRC="/runtime-config.js"
fi

sed -i "s|<head>|<head><script src='$SCRIPT_SRC'></script>|" /usr/share/nginx/html/index.html

echo "Configuration injected into index.html"
echo "Verifying injection in index.html:"
grep "runtime-config.js" /usr/share/nginx/html/index.html || echo "Script tag not found!"

# Start nginx
exec nginx -g "daemon off;"
