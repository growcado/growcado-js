#!/bin/bash

# 🥑 Growcado SDK Examples Setup Script
# This script helps you set up the shared environment variables for both examples

echo "🥑 Setting up Growcado SDK Examples..."

# Check if we're in the examples directory
if [[ ! -f "../.env.example" ]]; then
    echo "❌ Error: Please run this script from the examples/ directory"
    echo "   Usage: cd examples && ./setup.sh"
    exit 1
fi

# Copy .env.example to .env if it doesn't exist
if [[ ! -f "../.env" ]]; then
    echo "📄 Copying .env.example to .env..."
    cp ../.env.example ../.env
    echo "✅ Created .env file with default values"
else
    echo "ℹ️  .env file already exists, skipping copy"
fi

echo ""
echo "🎯 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your values: nano ../.env"
echo "   2. Run vanilla example: cd vanilla-sdk && npm install && npm run dev"
echo "   3. Run React example: cd react-app && npm install && npm run dev"
echo ""
echo "🌐 Default URLs:"
echo "   • Vanilla SDK: http://localhost:5173"
echo "   • React SDK: http://localhost:3020"
echo ""
echo "📚 See README.md for more details and testing instructions" 