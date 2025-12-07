# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit || npm install --no-audit
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=27777
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit || npm install --omit=dev --no-audit
COPY server ./server
COPY dist ./dist
EXPOSE 27777
CMD ["node", "server/proxy.js"]
