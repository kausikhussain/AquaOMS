# Multi-stage build for Amrit Dhara full-stack application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy full application codebase
COPY . .

# Build Vite frontend and esbuild server bundle
RUN npm run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder stage
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Install only production dependencies
RUN npm ci --only=production

EXPOSE 3000

# Execute server-side Express runtime
CMD ["node", "server.js"]
