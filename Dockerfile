# ── Stage 1 : Build React ─────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2 : Nginx serve ─────────────────────────────────
FROM nginx:1.25-alpine AS runner

# gettext pour envsubst
RUN apk add --no-cache gettext

# Copie le build React
COPY --from=builder /app/dist /usr/share/nginx/html

# Template nginx (injecté au démarrage via envsubst)
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
