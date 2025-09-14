#!/bin/bash

# 2D Metaverse Deployment Script
echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "metaverse/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd metaverse
pnpm install

# Build all applications
echo "🔨 Building all applications..."
pnpm run build:all

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Your app is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect to Railway/Render/Vercel"
    echo "3. Set up environment variables"
    echo "4. Deploy!"
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed! Please check the errors above"
    exit 1
fi
