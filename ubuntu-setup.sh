#!/bin/bash

# ============================================
#  Ubuntu Headless Mini PC Setup for Φωνή
#  Run this script on your Ubuntu mini PC
# ============================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🐳 Installing Φωνή (Foni) on Ubuntu Headless         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please don't run this script as root/sudo.${NC}"
    echo "Run it as your normal user. It will ask for sudo when needed."
    exit 1
fi

APP_DIR="$HOME/foni"

# Step 1: Install Docker if not present
echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    
    # Remove old versions
    sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Update and install prerequisites
    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group (no sudo needed for docker commands)
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✅ Docker installed!${NC}"
    echo -e "${YELLOW}Note: You may need to log out and back in for group changes to take effect.${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Step 2: Install Tailscale (optional but recommended)
echo ""
echo -e "${YELLOW}Step 2: Checking Tailscale installation...${NC}"
if ! command -v tailscale &> /dev/null; then
    read -p "Install Tailscale for remote access? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        curl -fsSL https://tailscale.com/install.sh | sh
        echo -e "${GREEN}✅ Tailscale installed!${NC}"
        echo -e "${YELLOW}Run 'sudo tailscale up' to connect.${NC}"
    fi
else
    echo -e "${GREEN}✅ Tailscale already installed${NC}"
fi

# Step 3: Create app directory
echo ""
echo -e "${YELLOW}Step 3: Setting up app directory...${NC}"
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/notes"
mkdir -p "$APP_DIR/settings"
echo -e "${GREEN}✅ Created $APP_DIR${NC}"

# Step 4: Create docker-compose.yml
echo ""
echo -e "${YELLOW}Step 4: Creating Docker configuration...${NC}"
cat > "$APP_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  foni:
    image: node:20-alpine
    container_name: foni-voice-notes
    working_dir: /app
    ports:
      - "9959:9959"
    volumes:
      - ./notes:/app/notes
      - ./settings:/app/settings
      - ./dist:/app/dist
      - ./server.js:/app/server.js
    environment:
      - NODE_ENV=production
      - PORT=9959
    command: node server.js
    restart: unless-stopped
    networks:
      - foni-network

networks:
  foni-network:
    driver: bridge
EOF
echo -e "${GREEN}✅ Created docker-compose.yml${NC}"

# Step 5: Create management scripts
echo ""
echo -e "${YELLOW}Step 5: Creating management scripts...${NC}"

# Start script
cat > "$APP_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Φωνή..."
docker compose up -d
echo ""
echo "✅ App started!"
echo "   Local: http://localhost:9959"
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$TAILSCALE_IP" ]; then
    echo "   Tailscale: http://$TAILSCALE_IP:9959"
fi
EOF
chmod +x "$APP_DIR/start.sh"

# Stop script
cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Stopping Φωνή..."
docker compose down
echo "✅ App stopped"
EOF
chmod +x "$APP_DIR/stop.sh"

# Restart script
cat > "$APP_DIR/restart.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Restarting Φωνή..."
docker compose restart
echo "✅ App restarted"
EOF
chmod +x "$APP_DIR/restart.sh"

# Logs script
cat > "$APP_DIR/logs.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
docker compose logs -f
EOF
chmod +x "$APP_DIR/logs.sh"

# Status script
cat > "$APP_DIR/status.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Φωνή (Foni) Status"
echo "═══════════════════════════════════════════════════════════"
echo ""
docker compose ps
echo ""
echo "Access URLs:"
echo "  Local:     http://localhost:9959"
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$TAILSCALE_IP" ]; then
    echo "  Tailscale: http://$TAILSCALE_IP:9959"
fi
echo ""
echo "Notes saved to: $(pwd)/notes/"
echo ""
EOF
chmod +x "$APP_DIR/status.sh"

# Update script
cat > "$APP_DIR/update.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Updating Φωνή..."
echo ""
echo "Step 1: Pulling latest image..."
docker compose pull

echo ""
echo "Step 2: Rebuilding..."
docker compose up -d --build

echo ""
echo "✅ Update complete!"
EOF
chmod +x "$APP_DIR/update.sh"

echo -e "${GREEN}✅ Created management scripts${NC}"

# Step 6: Create systemd service for auto-start
echo ""
echo -e "${YELLOW}Step 6: Setting up auto-start on boot...${NC}"

SERVICE_FILE="/etc/systemd/system/foni.service"

sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Φωνή (Foni) - Greek Voice Notes
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable foni.service

echo -e "${GREEN}✅ Auto-start configured!${NC}"
echo "The app will start automatically when the mini PC boots."

# Step 7: Create a README in the app directory
echo ""
echo -e "${YELLOW}Step 7: Creating local README...${NC}"
cat > "$APP_DIR/README.md" << EOF
# Φωνή (Foni) - Voice Notes

## Quick Commands

\`\`\`bash
./start.sh      # Start the app
./stop.sh       # Stop the app
./restart.sh    # Restart the app
./status.sh     # Check status
./logs.sh       # View logs
./update.sh     # Update the app
\`\`\`

## Access

- Local: http://localhost:9959
- Tailscale: http://YOUR-TAILSCALE-IP:9959

## Notes Location

Notes are saved to: \`$APP_DIR/notes/\`

## Auto-Start

The app starts automatically on boot via systemd.

To disable: \`sudo systemctl disable foni.service\`
To enable:  \`sudo systemctl enable foni.service\`
EOF

echo -e "${GREEN}✅ Created README${NC}"

# Done!
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║  ✅ Installation Complete!                             ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "App directory: $APP_DIR"
echo ""
echo "Next steps:"
echo ""
echo "  1. Copy the app files (dist/, server.js) to: $APP_DIR/"
echo ""
echo "     You can do this from your main computer:"
echo "     scp -r dist/ server.js user@mini-pc:$APP_DIR/"
echo ""
echo "  2. Start the app:"
echo "     cd $APP_DIR && ./start.sh"
echo ""
echo "  3. Enable Tailscale (if installed):"
echo "     sudo tailscale up"
echo ""
echo "  4. Access from your phone:"
echo "     http://YOUR-TAILSCALE-IP:9959"
echo ""
echo "The app will auto-start on every boot!"
echo ""
echo "Management commands:"
echo "  cd $APP_DIR"
echo "  ./start.sh      # Start"
echo "  ./stop.sh       # Stop"
echo "  ./restart.sh    # Restart"
echo "  ./status.sh     # Check status"
echo "  ./logs.sh       # View logs"
echo ""
