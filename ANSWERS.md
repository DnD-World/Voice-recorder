# 📋 Quick Answers to Your Questions

## 1. Auto-Start the App

**Yes!** I've created auto-start setup scripts for each platform:

### Windows
```cmd
setup-autostart-windows.bat
```
Double-click this file. It creates a shortcut in your Startup folder.

### Mac
```bash
chmod +x setup-autostart-mac.sh
./setup-autostart-mac.sh
```
Creates a LaunchAgent that starts the app on login.

### Linux
```bash
chmod +x setup-autostart-linux.sh
./setup-autostart-linux.sh
```
Creates a desktop entry in `~/.config/autostart/`.

**To disable auto-start:**
- Windows: Delete the shortcut from `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`
- Mac: `launchctl unload ~/Library/LaunchAgents/com.foni.voicenotes.plist`
- Linux: Delete `~/.config/autostart/foni-voice-notes.desktop`

---

## 2. Docker Desktop Support

**Yes!** Full Docker support is included:

### Quick Start
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### What You Get
- **Container name:** `foni-voice-notes`
- **Port:** 99599 (same as regular)
- **Auto-restart:** Yes (if container crashes)
- **Persistent storage:** Notes saved to `./notes/` folder

### Access
- **Local:** http://localhost:99599
- **Phone (Tailscale):** http://YOUR-TAILSCALE-IP:99599

### Volumes
```yaml
volumes:
  - ./notes:/app/notes      # Auto-saved notes
  - ./settings:/app/settings # App settings
```

**See [DOCKER-SETUP.md](DOCKER-SETUP.md) for full details**

---

## 3. Where Are Transcripts Saved?

### Current Save Locations:

#### ✅ Local Auto-Save (ALWAYS ACTIVE)
**Location:** `./autosave/` folder (next to the app)
- **When:** Every checkpoint interval (default: 1 minute)
- **Format:** Markdown (.md) with timestamps
- **Setup:** None required - works automatically!

**Example files:**
```
autosave/
├── voice-notes-2026-01-15T14-30.md
├── voice-notes-2026-01-15T14-32.md
└── voice-notes-2026-01-15T14-34.md
```

#### ✅ Manual Download
**Location:** Your Downloads folder
- **When:** You click the download button
- **Format:** .md or .txt
- **Setup:** None required

#### ✅ Email Export
**Location:** Your email inbox
- **When:** You click the email button
- **Setup:** Enable in Settings + enter email address

#### ⚠️ Google Drive (NOT ENABLED BY DEFAULT)
**Location:** Your Google Drive account
- **When:** Every checkpoint interval (if enabled)
- **Setup Required:** YES - requires OAuth setup

**To enable Google Drive:**
1. Create Google Cloud Project
2. Enable Drive API
3. Create OAuth 2.0 credentials
4. Update Client ID in code (line ~220 in App.tsx)
5. Enable "Google Drive sync" in Settings
6. Optionally specify a folder ID

**See [SETUP-GUIDE.md](SETUP-GUIDE.md) for step-by-step instructions**

---

## Summary

| Question | Answer |
|----------|--------|
| **Auto-start?** | ✅ Yes - run the setup script for your platform |
| **Docker support?** | ✅ Yes - `docker-compose up -d` |
| **Where are notes saved?** | `./autosave/` folder (automatic, every minute) |
| **Google Drive folder?** | ⚠️ Not by default - requires OAuth setup |

---

## Quick Start Checklist

1. ✅ **Install dependencies:** `npm install`
2. ✅ **Start the app:** `node start.js`
3. ✅ **Open in browser:** http://localhost:99599
4. ✅ **Add API key** in Settings (Gemini recommended)
5. ✅ **Start recording** - notes auto-save to `./autosave/`
6. ✅ **Optional:** Set up auto-start, Docker, or Google Drive

---

## Files You Need

### To Run the App
- `start.js` (universal launcher)
- OR `start-windows.bat` / `start-mac-linux.sh`

### To Enable Auto-Start
- `setup-autostart-windows.bat`
- OR `setup-autostart-mac.sh`
- OR `setup-autostart-linux.sh`

### To Use Docker
- `Dockerfile`
- `docker-compose.yml`
- Run: `docker-compose up -d`

### To Find Your Notes
- Look in the `./autosave/` folder
- Or use the download/email buttons in the app

---

## Bottom Line

**Your notes are automatically saved to the `./autosave/` folder every minute.**

No Google Drive setup required. No cloud account needed. Just run the app and your notes are saved locally.

If you want Google Drive backup, you need to set up OAuth credentials manually (see SETUP-GUIDE.md).

---

**Need help?** Check the documentation:
- [README.md](README.md) - Overview
- [QUICKSTART.md](QUICKSTART.md) - Quick start
- [SETUP-GUIDE.md](SETUP-GUIDE.md) - Detailed setup
- [DOCKER-SETUP.md](DOCKER-SETUP.md) - Docker guide
- [WHERE-NOTES-SAVE.md](WHERE-NOTES-SAVE.md) - Save locations
