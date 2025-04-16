#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=postgres psql -h db -U postgres -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application in development mode with turbo
echo "Starting the application in development mode..."
npm run dev -- --turbo