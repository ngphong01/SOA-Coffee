FROM node:18-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
COPY services/user-service/package*.json ./services/user-service/
RUN npm install --prefix shared --omit=dev && npm install --prefix services/user-service --omit=dev && npm cache clean --force

COPY shared ./shared
COPY services/user-service/src ./services/user-service/src/

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodeuser -u 1001 \
  && mkdir -p /app/uploads \
  && chmod 777 /app/uploads \
  && chown -R nodeuser:nodejs /app

ENV PORT=3002
ENV NODE_PATH=/app/shared/node_modules:/app/services/user-service/node_modules
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "services/user-service/src/index.js"]
