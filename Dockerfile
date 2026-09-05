# 全栈单容器：构建前端产物，运行 Express（同时服务 /api 与静态资源）
FROM node:22-alpine AS webbuild
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=webbuild /app/web/dist ./web/dist
WORKDIR /app/server
EXPOSE 3000
CMD ["node", "src/index.js"]
