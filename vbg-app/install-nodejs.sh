#!/bin/bash

# Install Node.js on the server
# Run this ON THE SERVER

echo "========================================="
echo "Installing Node.js v18"
echo "========================================="
echo ""

# Check if we have permission to install globally
if command -v node &> /dev/null; then
    echo "Node.js is already installed: $(node --version)"
    exit 0
fi

# Try to install using nvm (Node Version Manager) - works without sudo
echo "Installing Node.js using nvm..."
echo ""

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

echo ""
echo "✓ Node.js installed: $(node --version)"
echo "✓ npm installed: $(npm --version)"
echo ""
echo "Add this to your ~/.bashrc or ~/.bash_profile:"
echo 'export NVM_DIR="$HOME/.nvm"'
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
