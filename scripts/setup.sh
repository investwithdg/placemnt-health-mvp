#!/bin/bash

# Placement Health MVP Setup Script
echo "🚀 Setting up Placement Health MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📋 Setting up environment variables..."
    cp env.example .env.local
    echo "✅ Created .env.local - Please update with your actual values"
else
    echo "ℹ️  .env.local already exists"
fi

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "🔧 Initializing git repository..."
    git init
    npm run prepare
else
    echo "ℹ️  Git repository already initialized"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p public/uploads
mkdir -p logs

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual configuration values"
echo "2. Set up your Supabase project:"
echo "   - Create a new Supabase project"
echo "   - Copy the URL and keys to .env.local"
echo "   - Run the database migrations"
echo "3. Run 'npm run db:push' to set up the database schema"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "For detailed setup instructions, see README.md"
