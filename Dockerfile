FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy server files
COPY server/ ./server/

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/server.js"]