# 🎤 Φωνή (Foni) - Greek Voice Notes

Live Greek speech transcription app with auto-save, Docker support, and multiple export options.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)

## ✨ Features

- **Live transcription** in Greek (and other languages)
- **4 AI engines**: Gemini 2.0 Flash Live, Groq Whisper, Voxtral Mini, Browser
- **Auto-save** every minute to local files
- **Multiple export**: Markdown, plain text, clipboard, email
- **Cross-platform**: Web, Desktop, Mobile (via Tailscale)
- **Docker support** for headless deployment
- **Google Drive backup** (optional)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Then open: **http://localhost:9959**

### Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Desktop Launcher

**Windows:**
```cmd
start-windows.bat
```

**Mac/Linux:**
```bash
chmod +x start-mac-linux.sh
./start-mac-linux.sh
```

## 📱 Access from Phone (via Tailscale)

1. Start the app on your computer
2. Find your Tailscale IP: `tailscale ip -4`
3. Open on phone: `http://YOUR-TAILSCALE-IP:9959`

## 🐧 Ubuntu Headless Setup

For headless Ubuntu mini PC with auto-start:

```bash
# Run setup script
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh

# Copy app files
scp -r dist/ server.js user@mini-pc:~/foni/

# Start the app
cd ~/foni && ./start.sh
```

See [UBUNTU-DOCKER-GUIDE.md](UBUNTU-DOCKER-GUIDE.md) for detailed instructions.

## 📁 Where Notes Are Saved

| Method | Location | When |
|--------|----------|------|
| **Auto-save** | `./autosave/` | Every minute (configurable) |
| **Manual download** | Downloads folder | On click |
| **Email** | Your inbox | On click |
| **Google Drive** | Your Drive | Every minute (if enabled) |

## ⚙️ Configuration

### 1. Choose Transcription Engine

| Engine | API Key | Quality | Cost |
|--------|---------|---------|------|
| **Gemini 2.0 Flash Live** | [Get key](https://aistudio.google.com/apikey) | ⭐⭐⭐⭐⭐ | Free tier |
| **Groq Whisper V3** | [Get key](https://console.groq.com/keys) | ⭐⭐⭐⭐ | Free tier |
| **Voxtral Mini** | [Get key](https://console.mistral.ai/api-keys/) | ⭐⭐⭐⭐ | Free tier |
| **Browser** | N/A | ⭐⭐⭐ | Free |

### 2. Setup in App

1. Open Settings (gear icon)
2. Select your engine
3. Paste your API key
4. Choose language (default: Greek)
5. Set checkpoint interval

### 3. Optional: Google Drive

1. Create Google Cloud Project
2. Enable Drive API
3. Create OAuth credentials
4. Paste Client ID in Settings
5. Enable "Google Drive sync"

## 📂 Project Structure

```
foni/
├── src/                    # Source code
│   ├── App.tsx            # Main app
│   ├── services/          # API integrations
│   │   ├── transcription/ # AI engines
│   │   ├── googleDrive.ts # Google Drive
│   │   ├── email.ts       # Email export
│   │   └── fileExport.ts  # File downloads
│   └── types.ts           # TypeScript types
├── dist/                   # Built app (generated)
├── autosave/              # Auto-saved notes
├── server.js              # Production server
├── docker-compose.yml     # Docker config
├── Dockerfile             # Docker build
└── package.json           # Dependencies
```

## 🔧 Commands

```bash
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Start production server
npm run typecheck    # TypeScript check
```

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions
- Use Chrome or Edge
- Must be HTTPS (except localhost)

### Can't Access from Phone
- Make sure Tailscale is running
- Check firewall allows port 9959
- Verify Tailscale IP is correct

### Notes Not Saving
- Check `autosave/` folder exists
- Check server logs
- Verify disk space

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [SETUP-GUIDE.md](SETUP-GUIDE.md) - Detailed setup
- [DOCKER-SETUP.md](DOCKER-SETUP.md) - Docker guide
- [UBUNTU-DOCKER-GUIDE.md](UBUNTU-DOCKER-GUIDE.md) - Ubuntu headless setup
- [WHERE-NOTES-SAVE.md](WHERE-NOTES-SAVE.md) - Save locations

## 🔒 Security Notes

- API keys are stored in browser localStorage
- For private Tailscale networks only
- Not recommended for public deployment without additional security
- Consider using a backend proxy for API keys in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 💡 Tips for Greek Transcription

1. **Use Gemini 2.0 Flash Live** - best quality for Greek
2. **Enable Smart mode** - removes filler words
3. **Speak clearly** at moderate pace
4. **Set checkpoint to 1-2 min** - good balance
5. **Check `autosave/` folder** - your notes are there!

---

**Καλή επιτυχία!** (Good luck!)
