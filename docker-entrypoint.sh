#!/bin/sh
set -e

echo "Injecting runtime configuration into index.html..."

# Create runtime config script
cat > /tmp/runtime-config.js << EOF
window.__RUNTIME_CONFIG__ = {
  keycloakUrl: '${VITE_KEYCLOAK_URL}',
  keycloakRealm: '${VITE_KEYCLOAK_REALM}',
  keycloakClientId: '${VITE_KEYCLOAK_CLIENT_ID}',
  wisefoodApiUrl: '${VITE_WISEFOOD_API_URL}'
};
EOF

echo "Runtime configuration:"
cat /tmp/runtime-config.js

# Copy the config to nginx served directory first
cp /tmp/runtime-config.js /usr/share/nginx/html/runtime-config.js

# Inject the script reference into index.html in the head section
# Use /app/ prefix if CONTEXT_PATH is set, otherwise just /
if [ "$CONTEXT_PATH" = "/app" ]; then
  sed -i "s|</head>|<script src='/app/runtime-config.js'></script></head>|" /usr/share/nginx/html/index.html
else
  sed -i "s|</head>|<script src='/runtime-config.js'></script></head>|" /usr/share/nginx/html/index.html
fi

echo "Configuration injected into index.html"
echo "Verifying injection in index.html:"
grep -A 2 "runtime-config.js" /usr/share/nginx/html/index.html || echo "Script tag not found!"

# Start nginx
exec nginx -g "daemon off;"
