FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY shared/package*.json ./shared/
COPY services/analytics-service/package*.json ./services/analytics-service/
RUN npm install --prefix shared --omit=dev --no-cache && npm install --prefix services/analytics-service --omit=dev --no-cache

COPY shared ./shared
COPY services/analytics-service/src ./services/analytics-service/src/

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodeuser -u 1001 \
  && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3012
ENV NODE_PATH=/app/shared/node_modules:/app/services/analytics-service/node_modules
EXPOSE 3012

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3012/health || exit 1

CMD ["node", "services/analytics-service/src/index.js"]
