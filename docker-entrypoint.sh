#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

# Start the application
echo "Starting the application..."
exec node src/index.js
