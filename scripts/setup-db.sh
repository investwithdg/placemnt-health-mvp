#!/bin/bash

# Database Setup Script for Placement Health MVP
echo "🗄️  Setting up database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please run ./scripts/setup.sh first."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📦 Generating database schema..."
npm run db:generate

echo "🚀 Pushing schema to database..."
npm run db:push

echo "🔒 Applying RLS policies..."
# Run the RLS policies SQL
psql "$DATABASE_URL" -f lib/db/rls-policies.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify the schema was created correctly"
echo "2. Run 'npm run db:studio' to view the database"
echo "3. Start the development server with 'npm run dev'"
