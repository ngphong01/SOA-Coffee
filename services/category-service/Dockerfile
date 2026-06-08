FROM node:18-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
COPY services/category-service/package*.json ./services/category-service/
RUN npm install --prefix shared --omit=dev && npm install --prefix services/category-service --omit=dev && npm cache clean --force

COPY shared ./shared
COPY services/category-service/src ./services/category-service/src/

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodeuser -u 1001 \
 && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3004
ENV NODE_PATH=/app/shared/node_modules:/app/services/category-service/node_modules
EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "services/category-service/src/index.js"]
