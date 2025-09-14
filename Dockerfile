# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY metaverse/package*.json metaverse/pnpm-lock.yaml ./metaverse/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build all applications
RUN cd metaverse && pnpm run build:all

# Expose ports
EXPOSE 3000 3001 5173

# Start all services
CMD ["cd", "metaverse", "&&", "pnpm", "run", "start:all"]
