#!/bin/bash
set -e

echo "🐳 Building Rooster Construction Docker Image"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build the image
echo "Building Docker image..."
docker build -t rooster-construction:latest .

echo ""
echo "✅ Build complete!"
echo ""
echo "Image size:"
docker images rooster-construction:latest

echo ""
echo "🚀 To run the container:"
echo "   docker-compose up -d"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
