# 🎤 Φωνή (Foni) - Greek Voice Notes

Live Greek speech transcription with auto-save, Docker support, and multiple export options.

## ✨ What You Get

### Core Features
- **Live transcription** in Greek (and other languages)
- **4 AI engines**: Gemini, Groq, Mistral, Browser
- **Auto-save** every minute to local files
- **Multiple export**: .md, .txt, clipboard, email
- **Cross-platform**: Web, Desktop, Mobile (via Tailscale)

### Save Locations
| Method | Where | When | Setup |
|--------|-------|------|-------|
| **Local Auto-Save** | `./autosave/` | Every minute | None ✅ |
| **Manual Download** | Downloads folder | On click | None ✅ |
| **Email** | Your inbox | On click | Email address |
| **Google Drive** | Your Drive | Every minute | OAuth setup |

**Bottom line:** Notes auto-save to `./autosave/` folder. No setup needed!

---

## 🚀 Quick Start

### Option 1: Run Directly (Recommended)

```bash
# Install dependencies (first time only)
npm install

# Start the app
node start.js
```

Then open: **http://localhost:99599**

### Option 2: Use Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

Then open: **http://localhost:99599**

### Option 3: Desktop Executable

**Windows:**
```cmd
build-desktop-windows.bat
```

**Mac/Linux:**
```bash
chmod +x build-desktop-mac.sh
./build-desktop-mac.sh
```

---

## 📱 Access from Phone (via Tailscale)

1. Start the app on your computer
2. Find your Tailscale IP: `tailscale ip -4`
3. Open on phone: `http://YOUR-TAILSCALE-IP:99599`

Example: `http://100.64.1.23:99599`

---

## 🔄 Auto-Start on Login

### Windows
```cmd
setup-autostart-windows.bat
```

### Mac
```bash
chmod +x setup-autostart-mac.sh
./setup-autostart-mac.sh
```

### Linux
```bash
chmod +x setup-autostart-linux.sh
./setup-autostart-linux.sh
```

---

## 📁 Where Notes Are Saved

### 1. Local Auto-Save (Always Active)
**Location:** `./autosave/` folder

Files are saved every minute with timestamps:
```
autosave/
├── voice-notes-2026-01-15T14-30.md
├── voice-notes-2026-01-15T14-32.md
└── voice-notes-2026-01-15T14-34.md
```

### 2. Manual Download
Click "📝 .md" or "📄 .txt" button → saves to Downloads folder

### 3. Email
Click "✉️ Email" → sends to your configured email address

### 4. Google Drive (Optional)
Requires OAuth setup → auto-syncs to your Google Drive

**See [WHERE-NOTES-SAVE.md](WHERE-NOTES-SAVE.md) for details**

---

## 🐳 Docker Setup

### Quick Start
```bash
docker-compose up -d
```

### What's Included
- **Container name:** `foni-voice-notes`
- **Port:** 99599
- **Volumes:**
  - `./notes/` → Auto-saved notes
  - `./settings/` → App settings

### Commands
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose down && docker-compose build && docker-compose up -d
```

**See [DOCKER-SETUP.md](DOCKER-SETUP.md) for details**

---

## 🎯 Setup Guide

### 1. Choose Transcription Engine

**Recommended for Greek: Gemini 3.5 Transcribe Live**

| Engine | Get API Key | Quality | Cost |
|--------|-------------|---------|------|
| **Gemini** | https://aistudio.google.com/apikey | ⭐⭐⭐⭐⭐ | Free tier |
| **Groq** | https://console.groq.com/keys | ⭐⭐⭐⭐ | Free tier |
| **Mistral** | https://console.mistral.ai/api-keys/ | ⭐⭐⭐⭐ | Free tier |
| **Browser** | N/A | ⭐⭐⭐ | Free |

### 2. Configure in App

1. Open Settings (gear icon)
2. Select your engine
3. Paste your API key
4. Choose language (default: Greek)
5. Set checkpoint interval (default: 1 minute)

### 3. Optional: Email Export

1. Enable "Email Notes" in Settings
2. Enter your email address
3. Use "✉️ Email" button to send notes

### 4. Optional: Google Drive

1. Create Google Cloud Project
2. Enable Drive API
3. Create OAuth credentials
4. Update Client ID in code
5. Enable "Google Drive sync" in Settings

**See [SETUP-GUIDE.md](SETUP-GUIDE.md) for detailed instructions**

---

## 📂 File Structure

```
foni/
├── start.js                    # Universal launcher
├── start-windows.bat           # Windows launcher
├── start-mac-linux.sh          # Mac/Linux launcher
├── server.js                   # HTTP server (port 99599)
├── Dockerfile                  # Docker config
├── docker-compose.yml          # Docker Compose config
├── setup-autostart-*.bat/sh    # Auto-start setup scripts
├── build-desktop-*.bat/sh      # Desktop executable builders
├── autosave/                   # Auto-saved notes (created automatically)
├── dist/                       # Built web app
├── src/                        # Source code
│   ├── App.tsx                 # Main app
│   ├── services/               # API integrations
│   │   ├── transcription/      # AI engines
│   │   ├── googleDrive.ts      # Google Drive
│   │   ├── email.ts            # Email export
│   │   └── fileExport.ts       # File downloads
│   └── ...
└── docs/
    ├── README.md               # This file
    ├── QUICKSTART.md           # Quick start guide
    ├── SETUP-GUIDE.md          # Detailed setup
    ├── DOCKER-SETUP.md         # Docker guide
    └── WHERE-NOTES-SAVE.md     # Save locations
```

---

## 🔧 Commands Reference

### Start/Stop
```bash
# Start app
node start.js

# Or use platform-specific launcher
./start-windows.bat      # Windows
./start-mac-linux.sh     # Mac/Linux

# Stop
# Press Ctrl+C
```

### Docker
```bash
docker-compose up -d     # Start
docker-compose down      # Stop
docker-compose logs -f   # View logs
```

### Build
```bash
npm install              # Install dependencies
npm run build            # Build web app
npm run dev              # Development mode
```

### Auto-Start Setup
```bash
./setup-autostart-windows.bat   # Windows
./setup-autostart-mac.sh        # Mac
./setup-autostart-linux.sh      # Linux
```

### Desktop Executable
```bash
./build-desktop-windows.bat     # Windows
./build-desktop-mac.sh          # Mac
./build-desktop-linux.sh        # Linux
```

---

## 💡 Tips for Greek Transcription

1. **Use Gemini** - best quality for Greek
2. **Enable Smart mode** - removes filler words
3. **Speak clearly** at moderate pace
4. **Set checkpoint to 1-2 min** - good balance
5. **Check `autosave/` folder** - your notes are there!

---

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions
- Use Chrome or Edge
- Must be HTTPS (except localhost)

### Notes Not Saving
- Check `autosave/` folder exists
- Check server logs
- Verify disk space

### Can't Access from Phone
- Make sure Tailscale is running
- Check firewall allows port 99599
- Verify Tailscale IP is correct

### Docker Issues
- Check Docker Desktop is running
- Verify port 99599 is free
- Check container logs: `docker-compose logs`

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[SETUP-GUIDE.md](SETUP-GUIDE.md)** - Detailed setup instructions
- **[DOCKER-SETUP.md](DOCKER-SETUP.md)** - Docker guide
- **[WHERE-NOTES-SAVE.md](WHERE-NOTES-SAVE.md)** - Where notes are saved

---

## 🎓 Summary

**What you have:**
- ✅ Live Greek transcription app
- ✅ Auto-saves to `./autosave/` every minute
- ✅ Works on web, desktop, and mobile (via Tailscale)
- ✅ Docker support
- ✅ Auto-start on login
- ✅ Multiple export options (.md, .txt, email, clipboard)
- ✅ Optional Google Drive sync (requires setup)

**To start:**
```bash
node start.js
```

**To access:**
- Computer: http://localhost:99599
- Phone: http://YOUR-TAILSCALE-IP:99599

**Notes are saved to:**
- `./autosave/` folder (automatic)
- Downloads folder (manual download)
- Your email (manual send)
- Google Drive (if configured)

---

Καλή επιτυχία! (Good luck!)
