# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev && npm cache clean --force
COPY . .
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS production-deps
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV RATE_LIMIT_MAX=1000
ENV RATE_LIMIT_WINDOW=900000
ENV REQUEST_TIMEOUT=30000
ENV MAX_BODY_SIZE=10mb
ENV ALLOWED_ORIGINS=*
ENV DEBUG_HEADERS=false
ENV DEBUG_ERRORS=false
ENV INCLUDE_CONFIG=false

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=production-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories and set permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]

# Labels for metadata
LABEL maintainer="Akramovic1"
LABEL version="1.0.0"
LABEL description="Open CORS Proxy - High-performance CORS proxy server"
LABEL org.opencontainers.image.source="https://github.com/Akramovic1/Open-CORS-Proxy"
LABEL org.opencontainers.image.documentation="https://github.com/Akramovic1/Open-CORS-Proxy#readme"
LABEL org.opencontainers.image.licenses="MIT"