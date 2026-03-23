#!/bin/sh
set -e

# Valeur par défaut si BACKEND_URL non définie + export obligatoire pour envsubst
export BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"

echo "[Pokélo] BACKEND_URL = $BACKEND_URL"

# Injecte BACKEND_URL dans la config nginx
envsubst '${BACKEND_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "[Pokélo] Nginx config générée"
cat /etc/nginx/conf.d/default.conf

# Démarre nginx
exec nginx -g "daemon off;"
