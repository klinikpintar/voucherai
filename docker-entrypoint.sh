#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

# Run admin seeder only
echo "Running admin seeder..."
npm run db:seed:admin

# Start the application
echo "Starting the application..."
exec node src/index.js
