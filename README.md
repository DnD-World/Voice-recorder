# Φωνή (Foni) - Greek Voice Notes

Live Greek speech transcription app with multiple AI engines, Google Drive backup, and email export.

## Features

- **Live Transcription**: Real-time Greek speech to text
- **Multiple AI Engines**:
  - Gemini 3.5 Transcribe Live (best quality)
  - Whisper Large V3 via Groq (fast, accurate)
  - Voxtral Mini Realtime via Mistral (low latency)
  - Browser Speech Recognition (offline, no API key)
- **Export Options**:
  - Download as Markdown (.md)
  - Download as Text (.txt)
  - Copy to clipboard
  - Email notes
  - Google Drive backup
- **Cross-Platform**:
  - Web app (any browser)
  - PWA (installable on Android/iOS)
  - Desktop executable (Windows/Mac/Linux)

## Quick Start

### Web App
1. Open `dist/index.html` in your browser, or
2. Deploy to any static hosting (Netlify, Vercel, GitHub Pages)

### Android (PWA)
1. Open the app in Chrome on your Android phone
2. Tap the menu (⋮) → "Add to Home screen"
3. The app will install as a standalone app

### Desktop Executable

#### Option 1: Nativefier (Easiest)
```bash
# Install Nativefier
npm install -g nativefier

# Create Windows executable
nativefier --name "Φωνή" --platform windows --arch x64 \
  --icon icon-512.png \
  --single-instance \
  "file:///path/to/dist/index.html" \
  --out ./desktop-app

# Or for Mac
nativefier --name "Φωνή" --platform mac --arch x64 \
  --icon icon-512.png \
  --single-instance \
  "file:///path/to/dist/index.html" \
  --out ./desktop-app

# Or for Linux
nativefier --name "Φωνή" --platform linux --arch x64 \
  --icon icon-512.png \
  --single-instance \
  "file:///path/to/dist/index.html" \
  --out ./desktop-app
```

#### Option 2: Electron Packager
```bash
# Install electron-packager
npm install -g electron-packager

# Package for Windows
electron-packager . φωνή --platform=win32 --arch=x64 --out=dist-desktop

# Package for Mac
electron-packager . φωνή --platform=darwin --arch=x64 --out=dist-desktop

# Package for Linux
electron-packager . φωνή --platform=linux --arch=x64 --out=dist-desktop
```

#### Option 3: Tauri (Smallest executable)
```bash
# Install Tauri CLI
cargo install tauri-cli

# Build (requires Rust)
tauri build
```

## Setup

### 1. Transcription Engine
Choose your preferred engine in Settings:

- **Gemini** (Recommended for Greek): Get API key at https://aistudio.google.com/apikey
- **Groq**: Get API key at https://console.groq.com/keys
- **Mistral**: Get API key at https://console.mistral.ai/api-keys/
- **Browser**: No API key needed (variable quality)

### 2. Email Export (Optional)
1. Enable "Email Notes" in Settings
2. Enter your email address
3. Use the ✉️ Email button to send notes

### 3. Google Drive Backup (Optional)
To enable Google Drive sync:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project
3. Enable "Google Drive API"
4. Go to "Credentials" → Create "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your deployed domain (e.g., `https://yourapp.com`)
7. Copy the Client ID
8. Update `src/App.tsx` line ~220:
   ```typescript
   const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
   ```
9. Rebuild the app
10. In Settings, enable "Google Drive sync"
11. Optionally add a folder ID to save to a specific folder

### 4. Language
Default is Greek (el-GR). Change in Settings if needed.

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure

```
src/
├── App.tsx                 # Main app component
├── types.ts               # TypeScript types
├── utils.ts               # Utility functions
├── services/
│   ├── audioCapture.ts    # Microphone audio capture
│   ├── transcription/     # Transcription providers
│   │   ├── gemini.ts
│   │   ├── groq.ts
│   │   ├── voxtral.ts
│   │   └── browser.ts
│   ├── googleDrive.ts     # Google Drive integration
│   ├── email.ts           # Email export
│   └── fileExport.ts      # File download/export
public/
├── manifest.json          # PWA manifest
└── sw.js                  # Service worker
```

## Tips for Greek Transcription

- **Gemini Transcribe Live** has the best Greek support
- Use "Smart" mode to clean up filler words
- Speak clearly at a moderate pace
- Use auto-save checkpoints (every 1-2 min recommended)
- Download as .md for formatted notes with timestamps

## Troubleshooting

### Microphone not working
- Check browser permissions
- Try Chrome or Edge (best support)
- Ensure HTTPS (required for microphone on most browsers)

### Transcription quality issues
- Try a different engine
- Check language setting matches your speech
- Speak closer to microphone
- Reduce background noise

### Google Drive sync not working
- Verify OAuth Client ID is correct
- Check authorized origins include your domain
- Ensure Google Drive API is enabled
- Try signing out and back in

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
