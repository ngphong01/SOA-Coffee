FROM node:18-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
COPY services/employee-service/package*.json ./services/employee-service/
RUN npm install --prefix shared --omit=dev && npm install --prefix services/employee-service --omit=dev && npm cache clean --force

COPY shared ./shared
COPY services/employee-service/src ./services/employee-service/src/

RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodeuser -u 1001 \
 && chown -R nodeuser:nodejs /app
USER nodeuser

ENV PORT=3008
ENV NODE_PATH=/app/shared/node_modules:/app/services/employee-service/node_modules
EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3008/health || exit 1

CMD ["node", "services/employee-service/src/index.js"]
