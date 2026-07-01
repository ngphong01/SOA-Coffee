FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY shared/package*.json ./shared/
COPY api-gateway/package*.json ./api-gateway/
RUN npm install --prefix shared --omit=dev --no-cache && npm install --prefix api-gateway --omit=dev --no-cache

COPY shared ./shared
COPY api-gateway/src ./api-gateway/src/

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodeuser -u 1001 \
  && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3000
ENV NODE_PATH=/app/shared/node_modules:/app/api-gateway/node_modules
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "api-gateway/src/index.js"]
