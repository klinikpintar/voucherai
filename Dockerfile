# Use Node.js Alpine for smaller image size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install Python and build dependencies for sqlite3
RUN apk add --no-cache python3 py3-setuptools python3-dev make g++ gcc sqlite-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
