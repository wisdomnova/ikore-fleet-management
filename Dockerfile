# Multi-stage build for Next.js Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
# If there are node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
