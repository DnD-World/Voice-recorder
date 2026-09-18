# 🐧 Ubuntu Headless Mini PC Setup Guide

## Overview

This guide sets up Φωνή (Foni) on a headless Ubuntu mini PC that:
- ✅ Runs 24/7
- ✅ Auto-starts on boot
- ✅ Survives restarts
- ✅ Accessible via Tailscale from your phone
- ✅ Saves notes to a local folder

---

## What You Need

- Ubuntu mini PC (any version 20.04+)
- SSH access (or physical access for initial setup)
- Internet connection (for initial setup)
- Tailscale account (free)

---

## Quick Setup (One Command)

**On your Ubuntu mini PC:**

```bash
# Download and run the setup script
curl -sL https://raw.githubusercontent.com/your-repo/foni/main/ubuntu-setup.sh | bash

# OR if you have the file locally:
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh
```

This script will:
1. Install Docker (if not present)
2. Install Tailscale (optional)
3. Create the app directory structure
4. Set up Docker Compose configuration
5. Create management scripts
6. Configure auto-start on boot

---

## Manual Setup (Step by Step)

If you prefer to do it manually:

### Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose-v2

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Step 2: Install Tailscale (Optional but Recommended)

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect to your Tailscale network
sudo tailscale up

# Note your Tailscale IP
tailscale ip -4
```

### Step 3: Create App Directory

```bash
# Create the app folder
mkdir -p ~/foni
cd ~/foni

# Create subdirectories
mkdir -p notes settings dist
```

### Step 4: Copy App Files

From your main computer, copy the built app:

```bash
# On your main computer (where you built the app):
scp -r dist/ server.js user@your-mini-pc:~/foni/
```

Or if you're on the mini PC already, copy from a USB drive or download.

### Step 5: Create Docker Compose File

```bash
cd ~/foni

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  foni:
    image: node:20-alpine
    container_name: foni-voice-notes
    working_dir: /app
    ports:
      - "99599:99599"
    volumes:
      - ./notes:/app/notes
      - ./settings:/app/settings
      - ./dist:/app/dist
      - ./server.js:/app/server.js
    environment:
      - NODE_ENV=production
      - PORT=99599
    command: node server.js
    restart: unless-stopped
EOF
```

### Step 6: Start the App

```bash
cd ~/foni
docker compose up -d
```

### Step 7: Verify It's Running

```bash
# Check status
docker compose ps

# Check logs
docker compose logs -f

# Test locally
curl http://localhost:99599
```

### Step 8: Set Up Auto-Start on Boot

```bash
# Create systemd service
sudo tee /etc/systemd/system/foni.service > /dev/null << EOF
[Unit]
Description=Φωνή (Foni) - Greek Voice Notes
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=$USER
WorkingDirectory=$HOME/foni
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable foni.service

# Start it now
sudo systemctl start foni.service
```

---

## Management Scripts

Create these handy scripts in `~/foni/`:

### start.sh
```bash
#!/bin/bash
cd "$(dirname "$0")"
docker compose up -d
echo "✅ Φωνή started"
```

### stop.sh
```bash
#!/bin/bash
cd "$(dirname "$0")"
docker compose down
echo "✅ Φωνή stopped"
```

### restart.sh
```bash
#!/bin/bash
cd "$(dirname "$0")"
docker compose restart
echo "✅ Φωνή restarted"
```

### status.sh
```bash
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
echo "  Local:     http://localhost:99599"
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$TAILSCALE_IP" ]; then
    echo "  Tailscale: http://$TAILSCALE_IP:99599"
fi
echo ""
echo "Notes saved to: $(pwd)/notes/"
echo ""
```

### logs.sh
```bash
#!/bin/bash
cd "$(dirname "$0")"
docker compose logs -f
```

Make them executable:
```bash
chmod +x *.sh
```

---

## Usage

### Start the App
```bash
cd ~/foni
./start.sh
```

### Stop the App
```bash
cd ~/foni
./stop.sh
```

### Check Status
```bash
cd ~/foni
./status.sh
```

### View Logs
```bash
cd ~/foni
./logs.sh
```

### Restart the App
```bash
cd ~/foni
./restart.sh
```

---

## Access from Your Phone

### Via Tailscale (Recommended)

1. Install Tailscale on your phone
2. Sign in with the same account
3. Find your mini PC's Tailscale IP:
   ```bash
   tailscale ip -4
   ```
4. Open on phone: `http://100.x.y.z:99599`

### Via Local Network

If both devices are on the same network:
1. Find your mini PC's local IP:
   ```bash
   hostname -I
   ```
2. Open on phone: `http://192.168.x.x:99599`

---

## Where Notes Are Saved

Notes are automatically saved to:
```
~/foni/notes/
```

Example files:
```
notes/
├── voice-notes-2026-01-15T14-30.md
├── voice-notes-2026-01-15T14-32.md
└── voice-notes-2026-01-15T14-34.md
```

### View Notes
```bash
ls -la ~/foni/notes/
cat ~/foni/notes/voice-notes-*.md
```

### Copy Notes to Your Computer
```bash
# From your main computer:
scp user@mini-pc:~/foni/notes/*.md ~/Documents/voice-notes/
```

---

## Auto-Start Management

### Check if Auto-Start is Enabled
```bash
sudo systemctl status foni.service
```

### Disable Auto-Start
```bash
sudo systemctl disable foni.service
```

### Re-Enable Auto-Start
```bash
sudo systemctl enable foni.service
```

### Manually Start/Stop via Systemd
```bash
sudo systemctl start foni.service
sudo systemctl stop foni.service
sudo systemctl restart foni.service
```

---

## Updating the App

When you have a new version:

```bash
cd ~/foni

# Copy new files
# (from your main computer or USB)

# Restart the app
./restart.sh

# Or manually:
docker compose restart
```

---

## Troubleshooting

### App Won't Start

```bash
# Check Docker is running
sudo systemctl status docker

# Check logs
docker compose logs

# Try starting manually
docker compose up
```

### Can't Access from Phone

1. Check Tailscale is running:
   ```bash
   sudo tailscale status
   ```

2. Check firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 99599/tcp
   ```

3. Check container is running:
   ```bash
   docker compose ps
   ```

### Notes Not Saving

```bash
# Check notes directory exists
ls -la ~/foni/notes/

# Check permissions
chmod 755 ~/foni/notes/

# Check container logs
docker compose logs | grep -i save
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker compose logs

# Check if port is in use
sudo lsof -i :99599

# Stop conflicting process or change port in docker-compose.yml
```

---

## Backup Your Notes

### Automatic Backup (Recommended)

Set up a cron job to backup notes daily:

```bash
# Edit crontab
crontab -e

# Add this line (backs up at 2 AM daily)
0 2 * * * tar -czf ~/foni-backup-$(date +\%Y\%m\%d).tar.gz ~/foni/notes/
```

### Manual Backup

```bash
# Create a backup
tar -czf foni-backup.tar.gz ~/foni/notes/

# Copy to another machine
scp foni-backup.tar.gz user@another-machine:~/backups/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf foni-backup.tar.gz -C ~/

# Restart the app
cd ~/foni && ./restart.sh
```

---

## Monitoring

### Check Resource Usage

```bash
# Docker stats
docker stats foni-voice-notes

# System resources
htop

# Disk usage
df -h ~/foni/
du -sh ~/foni/notes/
```

### Set Up Monitoring (Optional)

Install a simple monitoring tool:

```bash
# Install htop for resource monitoring
sudo apt install htop

# Install net-tools for network monitoring
sudo apt install net-tools
```

---

## Security

### Firewall Setup

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow the app port
sudo ufw allow 99599/tcp

# Check status
sudo ufw status
```

### Tailscale Security

Tailscale provides encrypted connections by default. No additional setup needed.

### Disable Root Login (Recommended)

```bash
sudo nano /etc/ssh/sshd_config

# Change:
PermitRootLogin no

# Restart SSH
sudo systemctl restart ssh
```

---

## Summary

**What you have:**
- ✅ Docker container running 24/7
- ✅ Auto-starts on boot
- ✅ Survives restarts
- ✅ Accessible via Tailscale from anywhere
- ✅ Notes saved to `~/foni/notes/`
- ✅ Easy management scripts
- ✅ Automatic backups (if configured)

**Quick commands:**
```bash
cd ~/foni
./start.sh      # Start
./stop.sh       # Stop
./status.sh     # Check status
./logs.sh       # View logs
```

**Access from phone:**
```
http://YOUR-TAILSCALE-IP:99599
```

---

## Need Help?

Check the logs:
```bash
cd ~/foni && ./logs.sh
```

Or view systemd logs:
```bash
sudo journalctl -u foni.service -f
```

Καλή επιτυχία! (Good luck!)
