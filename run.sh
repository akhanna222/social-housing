#!/bin/bash

# Social Housing Application - Quick Run Script
# Use this after initial setup is complete

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$BACKEND_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js version (requires 20.19+ or 22.12+)
NODE_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
NODE_MINOR=$(echo "$NODE_VERSION" | cut -d. -f2)

if [ "$NODE_MAJOR" -lt 20 ] || ([ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]) || [ "$NODE_MAJOR" -eq 21 ] || ([ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]); then
    echo -e "${RED}Error: Node.js $NODE_VERSION is not supported.${NC}"
    echo "Vite requires Node.js 20.19+ or 22.12+"
    echo ""
    echo "Upgrade with: nvm install 22 && nvm use 22"
    exit 1
fi

# Check if setup has been done
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please run ./setup-and-run.sh first to complete initial setup."
    exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ] || [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}Dependencies not installed. Installing...${NC}"
    cd "$PROJECT_ROOT" && npm install
    cd "$BACKEND_DIR" && npm install
fi

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Starting Social Housing Application              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

sleep 2

# Start frontend
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✓ Both servers are running!${NC}"
echo ""

wait
