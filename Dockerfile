FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y openssl

# Copy package files first
COPY package*.json ./

# Copy Prisma schema before installing dependencies
COPY prisma ./prisma

# Install dependencies (this will run prisma generate as postinstall)
RUN npm install

# Copy the rest of the application
COPY . .

# Only build in production
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]