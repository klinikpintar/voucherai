# Use Node.js Alpine for smaller image size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild sqlite3
RUN npm ci

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
