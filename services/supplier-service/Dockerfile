FROM node:18-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
COPY services/supplier-service/package*.json ./services/supplier-service/
RUN npm install --prefix shared --omit=dev && npm install --prefix services/supplier-service --omit=dev && npm cache clean --force

COPY shared ./shared
COPY services/supplier-service/src ./services/supplier-service/src/

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodeuser -u 1001 \
 && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3009
ENV NODE_PATH=/app/shared/node_modules:/app/services/supplier-service/node_modules
EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3009/health || exit 1

CMD ["node", "services/supplier-service/src/index.js"]
