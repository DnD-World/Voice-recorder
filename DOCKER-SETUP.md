# 🐳 Docker Setup Guide

## Quick Start with Docker Desktop

### 1. Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Access the App

- **Local:** http://localhost:99599
- **From phone (Tailscale):** http://YOUR-TAILSCALE-IP:99599

### 3. Stop the App

```bash
docker-compose down
```

---

## What's Included

### Volumes (Persistent Data)

The Docker setup mounts two folders:

1. **`./notes`** → `/app/notes` (inside container)
   - Auto-saved notes go here
   - Persists even if container is removed

2. **`./settings`** → `/app/settings` (inside container)
   - App settings and configuration
   - Persists across container restarts

### Auto-Save Location

Notes are saved to: `./notes/` folder (on your host machine)

Example:
```
your-app/
├── notes/
│   ├── voice-notes-2026-01-15T14-30.md
│   ├── voice-notes-2026-01-15T14-32.md
│   └── voice-notes-2026-01-15T14-34.md
└── settings/
```

---

## Docker Commands

### Start
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

### Restart
```bash
docker-compose restart
```

### View Logs
```bash
docker-compose logs -f
```

### Rebuild (after code changes)
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Remove Everything
```bash
docker-compose down -v
```

---

## Access from Phone via Tailscale

The Docker container listens on all interfaces (0.0.0.0), so it's accessible via Tailscale:

1. Start the container: `docker-compose up -d`
2. Find your Tailscale IP: `tailscale ip -4`
3. Open on phone: `http://YOUR-TAILSCALE-IP:99599`

---

## Docker Desktop Integration

### On Windows/Mac

1. Open Docker Desktop
2. You'll see "foni-voice-notes" container
3. Click to view logs, stats, etc.
4. Container auto-restarts if it crashes

### Port Mapping

- Container port: 99599
- Host port: 99599
- Accessible at: http://localhost:99599

---

## Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - NODE_ENV=production
  - PORT=99599
  - AUTO_SAVE_PATH=/app/notes
```

---

## Health Check

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# You'll see: (healthy) or (unhealthy)
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 99599
# Windows:
netstat -ano | findstr :99599

# Mac/Linux:
lsof -i :99599

# Stop the other process or change the port in docker-compose.yml
```

### Can't Access from Phone
1. Make sure Tailscale is running on both devices
2. Check Docker container is running: `docker ps`
3. Verify port is exposed: `docker port foni-voice-notes`

### Notes Not Saving
1. Check the `notes` folder exists: `ls -la notes/`
2. Check container logs: `docker-compose logs`
3. Verify permissions on the `notes` folder

---

## Advanced: Custom Docker Setup

If you want to customize the Docker setup:

### Change Port
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:99599"  # Host:Container
```

### Change Auto-Save Path
Edit `docker-compose.yml`:
```yaml
volumes:
  - ./my-custom-notes:/app/notes
```

### Add Environment Variables
Edit `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - PORT=99599
  - AUTO_SAVE_PATH=/app/notes
  - CUSTOM_VAR=value
```

---

## Summary

**Docker gives you:**
- ✅ Isolated environment (no conflicts)
- ✅ Easy to start/stop
- ✅ Auto-restart on crash
- ✅ Persistent notes in `./notes/`
- ✅ Works with Tailscale
- ✅ Health monitoring
- ✅ Easy to update

**Just run:**
```bash
docker-compose up -d
```

Then open: http://localhost:99599
