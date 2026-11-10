# AetherShare Signaling Server Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and server files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

EXPOSE 8080

ENV NODE_ENV=production
ENV SIGNALING_PORT=8080

CMD ["node", "server/server.js"]