#!/usr/bin/env bash

# ============================================================================
# Expense Calculator macOS Desktop App - Launcher Script
# ============================================================================
#
# This script launches the Electron app with hot reload support
# Backend auto-starts automatically!
# Usage: bash start.sh
#
# ============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Expense Calculator - macOS App Launcher                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if ports are available (ports used by dev servers)
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is in use (for $service)${NC}"
        return 1
    fi
    return 0
}

# ============================================================================
# Check Prerequisites
# ============================================================================

echo -e "${BLUE}📋 Checking Prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"

echo ""

# ============================================================================
# Check Ports
# ============================================================================

echo -e "${BLUE}🔌 Checking Ports...${NC}"

# Check port 5173 (Vite dev server - optional, only if using npm run dev:electron)
if ! check_port 5173 "Vite Dev Server"; then
    echo -e "${YELLOW}Killing process on port 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo -e "${GREEN}✓ Port 5173 available${NC}"

# Note: Port 3001 doesn't need to be checked because backend auto-starts in Electron
echo -e "${GREEN}✓ Backend will auto-start on port 3001${NC}"

echo ""

# ============================================================================
# Start Frontend (Vite) - Optional for Hot Reload
# ============================================================================

echo -e "${BLUE}🎨 Starting Vite Development Server (for hot reload)...${NC}"
cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install --silent
fi

npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!
echo -e "${GREEN}✓ Vite dev server started (PID: $VITE_PID)${NC}"
echo "  URL: http://localhost:5173"
echo "  Logs: /tmp/vite.log"

sleep 3

# Verify Vite is responding
for i in {1..10}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Vite responding on http://localhost:5173${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠️  Vite may still be compiling...${NC}"
    fi
    sleep 1
done

echo ""

# ============================================================================
# Start Electron App
# ============================================================================

echo -e "${BLUE}💻 Launching Electron App...${NC}"

if [ ! -d "node_modules" ]; then
    npm install --silent
fi

npx electron . 2>&1 &
ELECTRON_PID=$!
echo -e "${GREEN}✓ Electron app launched (PID: $ELECTRON_PID)${NC}"

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Application Started!                                   ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "│ ${BLUE}Backend:${NC}         Auto-starts with Electron app"
echo -e "│ ${BLUE}Backend Port:${NC}     3001 (auto-managed)"
echo -e "│ ${BLUE}Frontend Dev:${NC}     http://localhost:5173"
echo -e "│ ${BLUE}Electron App:${NC}     Launched (check Dock)"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "│ ${YELLOW}Frontend Changes:${NC}   Auto-reload (hot reload)"
echo -e "│ ${YELLOW}Backend Changes:${NC}    Restart app to apply"
echo -e "│ ${YELLOW}Press Ctrl+C:${NC}       Stop development servers"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $VITE_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Cleanup complete${NC}"
    echo ""
}

trap cleanup EXIT

# Keep script running
wait
