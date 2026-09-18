# ✅ What's New - Latest Updates

## 1. Google Drive OAuth Client ID in Settings

**Before:** You had to edit the source code to add your Google OAuth Client ID

**Now:** You can add it directly in the app Settings UI!

### How to Use

1. Open the app
2. Click the gear icon (Settings)
3. Enable "Google Drive sync"
4. Paste your OAuth Client ID in the new field
5. Optionally add a Folder ID
6. Done! No code editing needed

### Where to Get Your OAuth Client ID

1. Go to https://console.cloud.google.com/
2. Create a project (or use existing)
3. Enable "Google Drive API"
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth 2.0 Client ID"
6. Application type: "Web application"
7. Add authorized JavaScript origins:
   - `http://localhost:99599`
   - `http://YOUR-TAILSCALE-IP:99599`
8. Click "Create"
9. Copy the Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
10. Paste it in the app Settings

---

## 2. Ubuntu Headless Mini PC Setup

**Complete guide for running the app on a headless Ubuntu mini PC that:**
- ✅ Runs 24/7
- ✅ Auto-starts on boot
- ✅ Survives restarts
- ✅ Accessible via Tailscale from your phone
- ✅ Saves notes automatically

### Quick Setup (One Command)

**On your Ubuntu mini PC:**

```bash
# Download and run the setup script
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh
```

This will:
1. Install Docker
2. Install Tailscale (optional)
3. Create app directory structure
4. Set up Docker Compose
5. Create management scripts
6. Configure auto-start on boot

### Manual Setup

See **UBUNTU-DOCKER-GUIDE.md** for detailed step-by-step instructions.

### After Setup

**Copy the app files to your mini PC:**
```bash
# From your main computer:
scp -r dist/ server.js user@mini-pc:~/foni/
```

**Start the app:**
```bash
cd ~/foni
./start.sh
```

**Access from your phone:**
```
http://YOUR-TAILSCALE-IP:99599
```

### Management Commands

```bash
cd ~/foni

./start.sh      # Start the app
./stop.sh       # Stop the app
./restart.sh    # Restart the app
./status.sh     # Check status
./logs.sh       # View logs
./update.sh     # Update the app
```

### Auto-Start

The app automatically starts when the mini PC boots via systemd.

**Check status:**
```bash
sudo systemctl status foni.service
```

**Disable auto-start:**
```bash
sudo systemctl disable foni.service
```

**Re-enable auto-start:**
```bash
sudo systemctl enable foni.service
```

### Where Notes Are Saved

```
~/foni/notes/
```

Files are automatically saved every minute (configurable in Settings).

### Backup Your Notes

```bash
# Manual backup
tar -czf foni-backup.tar.gz ~/foni/notes/

# Copy to your main computer
scp user@mini-pc:~/foni/notes/*.md ~/Documents/
```

---

## Summary

### Google Drive Setup
- ✅ OAuth Client ID now in Settings (no code editing)
- ✅ Just paste your Client ID and you're done
- ✅ Step-by-step instructions in the app

### Ubuntu Mini PC
- ✅ Complete setup script: `ubuntu-setup.sh`
- ✅ Detailed guide: `UBUNTU-DOCKER-GUIDE.md`
- ✅ Auto-starts on boot
- ✅ Survives restarts
- ✅ Accessible via Tailscale
- ✅ Notes saved to `~/foni/notes/`
- ✅ Easy management scripts

---

## Files Created/Updated

### New Files
- `ubuntu-setup.sh` - One-command Ubuntu setup
- `UBUNTU-DOCKER-GUIDE.md` - Complete Ubuntu guide

### Updated Files
- `src/types.ts` - Added `googleOAuthClientId` field
- `src/App.tsx` - Settings UI now includes OAuth Client ID input
- `src/services/googleDrive.ts` - Uses settings value instead of hardcoded

---

## Quick Reference

### Google Drive Setup
1. Open app → Settings
2. Enable "Google Drive sync"
3. Paste OAuth Client ID
4. Done!

### Ubuntu Mini PC Setup
```bash
# On mini PC:
./ubuntu-setup.sh

# Copy files from main computer:
scp -r dist/ server.js user@mini-pc:~/foni/

# Start the app:
cd ~/foni && ./start.sh

# Access from phone:
http://YOUR-TAILSCALE-IP:99599
```

---

## Documentation

- **ANSWERS.md** - Quick answers to common questions
- **UBUNTU-DOCKER-GUIDE.md** - Complete Ubuntu setup guide
- **DOCKER-SETUP.md** - Docker setup for any platform
- **SETUP-GUIDE.md** - General setup instructions
- **WHERE-NOTES-SAVE.md** - Where notes are saved
- **README.md** - Complete overview

---

## What's Next?

1. ✅ Google Drive Client ID in Settings - DONE
2. ✅ Ubuntu headless setup - DONE
3. ✅ Auto-start on boot - DONE
4. ✅ Tailscale access - DONE
5. ✅ Auto-save notes - DONE

Everything you asked for is now implemented! 🎉

Καλή επιτυχία! (Good luck!)
