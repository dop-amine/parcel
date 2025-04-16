FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Development image
FROM base AS development
WORKDIR /app

# Install PostgreSQL client and tools
RUN apk add --no-cache postgresql-client

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Make the script executable
RUN chmod +x scripts/init-db.sh

EXPOSE 3000
CMD ["/bin/sh", "./scripts/init-db.sh"]

# Production image
FROM base AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Make the script executable
RUN chmod +x scripts/init-db.sh

EXPOSE 3000
CMD ["/bin/sh", "./scripts/init-db.sh"]