FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY shared/package*.json ./shared/
COPY services/inventory-service/package*.json ./services/inventory-service/
RUN npm install --prefix shared --omit=dev --no-cache && npm install --prefix services/inventory-service --omit=dev --no-cache

COPY shared ./shared
COPY services/inventory-service/src ./services/inventory-service/src/

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodeuser -u 1001 \
  && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3005
ENV NODE_PATH=/app/shared/node_modules:/app/services/inventory-service/node_modules
EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["node", "services/inventory-service/src/index.js"]
