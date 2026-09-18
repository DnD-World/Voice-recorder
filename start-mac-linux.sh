#!/bin/bash

# Set terminal title
echo -ne "\033]0;Φωνή - Greek Voice Notes Server\007"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║   🎤  Φωνή (Foni) - Greek Voice Notes                 ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║   Starting server on port 9959...                     ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Build folder not found. Building app...${NC}"
    echo ""
    npm install
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: Build failed!${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}✅ Build complete!${NC}"
    echo ""
fi

# Get Tailscale IP if available
echo -e "${BLUE}📡 Checking Tailscale connection...${NC}"
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$TAILSCALE_IP" ]; then
    echo -e "${GREEN}✅ Tailscale IP: $TAILSCALE_IP${NC}"
else
    echo -e "${YELLOW}⚠️  Tailscale not detected (that's okay)${NC}"
fi
echo ""

echo -e "${BLUE}🌐 Server starting...${NC}"
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Local access:${NC}    http://localhost:9959"

if [ -n "$TAILSCALE_IP" ]; then
    echo -e "  ${GREEN}Tailscale:${NC}       http://$TAILSCALE_IP:9959"
    echo ""
    echo -e "  ${YELLOW}📱 From your phone:${NC}"
    echo -e "     Open http://$TAILSCALE_IP:9959"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop the server"
echo ""

# Start the server
node server.js
