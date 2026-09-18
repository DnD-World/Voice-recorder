# Φωνή (Foni) - Complete Setup Guide

## What You Have

A complete Greek voice transcription app that works on:
- ✅ **Web browsers** (any device)
- ✅ **Android** (as installable PWA)
- ✅ **Desktop** (Windows/Mac/Linux executable)

## Features Included

### Core Features
- Live Greek speech transcription
- 4 AI engines (Gemini, Groq, Mistral, Browser)
- Real-time text display
- Auto-save checkpoints

### Export Options
- 📝 Download as Markdown (.md) - with formatting
- 📄 Download as Text (.txt) - plain text
- 📋 Copy to clipboard
- ✉️ Email to yourself
- ☁️ Google Drive backup

### Cross-Platform
- Works on phone, tablet, desktop
- Installable on Android as native app
- Can be packaged as desktop executable

---

## Quick Start

### Option 1: Use as Web App (Easiest)

1. Open `dist/index.html` in your browser
2. Or deploy to any web hosting (Netlify, Vercel, etc.)
3. Works immediately on any device

### Option 2: Install on Android (PWA)

1. Build the app: `npm run build`
2. Deploy to a web server (must be HTTPS)
3. Open in Chrome on Android
4. Tap menu (⋮) → "Add to Home screen"
5. App installs like a native app!

**Free hosting options:**
- Netlify: https://netlify.com (drag & drop `dist` folder)
- Vercel: https://vercel.com
- GitHub Pages: Free with GitHub account

### Option 3: Desktop Executable

#### Windows (Easiest)
```bash
# Just double-click this file:
build-desktop-windows.bat
```

Or manually:
```bash
npm install
npm run build
npm install --save-dev electron electron-packager
npx electron-packager . Foni --platform=win32 --arch=x64 --out=desktop-build
```

Your executable will be in: `desktop-build/Foni-win32-x64/Foni.exe`

#### Mac
```bash
chmod +x build-desktop-mac.sh
./build-desktop-mac.sh
```

Your app will be in: `desktop-build/Foni-darwin-x64/Foni.app`

#### Linux
```bash
chmod +x build-desktop-linux.sh
./build-desktop-linux.sh
```

Your executable will be in: `desktop-build/Foni-linux-x64/Foni`

---

## Setup Guide

### 1. Choose Transcription Engine

**Recommended for Greek: Gemini 3.5 Transcribe Live**

Get your API key:
- **Gemini**: https://aistudio.google.com/apikey (free tier available)
- **Groq**: https://console.groq.com/keys (free tier available)
- **Mistral**: https://console.mistral.ai/api-keys/ (free tier available)
- **Browser**: No API key needed (lower quality)

### 2. Configure Email Export (Optional)

1. Open Settings in the app
2. Enable "Email Notes"
3. Enter your email address
4. Use the ✉️ button to email your notes

### 3. Configure Google Drive Backup (Optional)

**Setup Steps:**

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project (e.g., "Foni Voice Notes")
3. Enable "Google Drive API":
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Foni App"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for testing)
     - `https://your-domain.com` (for production)
   - Click "Create"
5. Copy the Client ID
6. Edit `src/App.tsx`, find line ~220:
   ```typescript
   const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
   ```
   Replace with your actual Client ID
7. Rebuild: `npm run build`
8. In the app Settings:
   - Enable "Google Drive sync"
   - Optionally add a folder ID (from Google Drive URL)
   - The app will auto-sync at your checkpoint interval

**Finding Folder ID:**
- Open Google Drive folder in browser
- URL looks like: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
- Copy the FOLDER_ID_HERE part

---

## Usage Tips

### For Best Greek Transcription

1. **Use Gemini** - best quality for Greek
2. **Enable Smart mode** - removes filler words
3. **Speak clearly** at moderate pace
4. **Set checkpoint interval** to 1-2 minutes
5. **Download as .md** for formatted notes with timestamps

### Workflow for Book Notes

1. Start recording
2. Speak your thoughts in Greek
3. App transcribes in real-time
4. Auto-saves every 1-2 minutes
5. When done:
   - Download as .md (formatted)
   - Or sync to Google Drive
   - Or email to yourself
6. Import into your writing tool (Scrivener, Word, etc.)

### File Formats

**Markdown (.md)**
```markdown
# Voice Notes

**Date:** 15/01/2026
**Time:** 14:30:45

---

Your transcribed text here...
```

**Text (.txt)**
```
Your transcribed text here...
```

---

## Troubleshooting

### Microphone Not Working
- Check browser permissions (allow microphone)
- Use Chrome or Edge (best support)
- Must be HTTPS (except localhost)
- Try a different browser

### Poor Transcription Quality
- Try different engine (Gemini recommended)
- Check language setting (should be el-GR)
- Speak closer to microphone
- Reduce background noise
- Try "Smart" mode on Gemini

### Google Drive Not Syncing
- Verify Client ID is correct in code
- Check authorized origins match your domain
- Ensure Google Drive API is enabled
- Try signing out and back in
- Check browser console for errors (F12)

### Desktop App Issues
- Make sure you ran `npm run build` first
- Check that `dist/` folder exists
- Try running from command line to see errors
- On Mac, you may need to right-click → Open (security)

---

## File Structure

```
φoni/
├── dist/                    # Built web app (deploy this)
│   ├── index.html
│   └── assets/
├── src/                     # Source code
│   ├── App.tsx             # Main app
│   ├── services/           # API integrations
│   └── ...
├── public/                  # Static files
│   ├── manifest.json       # PWA config
│   └── sw.js               # Service worker
├── build-desktop-*.bat/sh  # Desktop build scripts
├── electron-main.js        # Electron config
└── README.md               # This file
```

---

## Deployment Options

### For Web (Recommended)

**Netlify (Easiest):**
1. Go to https://app.netlify.com/drop
2. Drag `dist` folder
3. Done! Get a URL like `https://your-app.netlify.app`

**Vercel:**
```bash
npm install -g vercel
vercel
```

**GitHub Pages:**
1. Push to GitHub
2. Enable Pages in settings
3. Point to `dist` folder

### For Desktop

Just copy the `desktop-build/Foni-*` folder to any computer:
- Windows: Run `Foni.exe`
- Mac: Run `Foni.app`
- Linux: Run `Foni` executable

No installation needed!

---

## API Keys Summary

| Engine | Get Key At | Cost | Greek Quality |
|--------|-----------|------|---------------|
| Gemini | https://aistudio.google.com/apikey | Free tier | ⭐⭐⭐⭐⭐ |
| Groq | https://console.groq.com/keys | Free tier | ⭐⭐⭐⭐ |
| Mistral | https://console.mistral.ai/api-keys/ | Free tier | ⭐⭐⭐⭐ |
| Browser | N/A | Free | ⭐⭐⭐ |

---

## Support

For issues or questions:
1. Check README.md for detailed docs
2. Check browser console (F12) for errors
3. Try different browser (Chrome recommended)
4. Verify API keys are correct

---

## Next Steps

1. ✅ Build the app: `npm run build`
2. ✅ Get API key for your chosen engine
3. ✅ Test transcription works
4. ✅ Set up email or Google Drive (optional)
5. ✅ Deploy or create desktop executable
6. ✅ Start taking voice notes in Greek!

Καλή επιτυχία! (Good luck!)
