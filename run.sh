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
