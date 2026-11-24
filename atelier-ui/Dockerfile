# Node 与 pnpm 的版本要与 .node-version、package.json 的 devEngines 一致，升级时一起改
FROM node:24.11.1-alpine AS builder

RUN npm i -g pnpm@12.23.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build-only

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
