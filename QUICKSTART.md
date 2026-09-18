# 🚀 Quick Start Guide

## How to Run the App

### Option 1: Universal Launcher (Recommended)

**All Platforms (Windows, Mac, Linux):**
```bash
node start.js
```

Or make it executable (Mac/Linux):
```bash
chmod +x start.js
./start.js
```

### Option 2: Platform-Specific Launchers

**Windows:**
```cmd
start-windows.bat
```
Just double-click the file!

**Mac/Linux:**
```bash
chmod +x start-mac-linux.sh
./start-mac-linux.sh
```

### Option 3: Direct Server Start

```bash
npm start
```

---

## 📱 Access from Your Phone via Tailscale

### Step 1: Start the Server on Your Computer

Run one of the commands above. You'll see output like:
```
══════════════════════════════════════════════════════════

  Local access:    http://localhost:99599
  Tailscale:       http://100.x.y.z:99599

  📱 From your phone:
     Open http://100.x.y.z:99599

══════════════════════════════════════════════════════════
```

### Step 2: Find Your Tailscale IP

If the launcher didn't detect it automatically:

**On your computer:**
```bash
tailscale ip -4
```

You'll get an IP like: `100.64.1.23`

### Step 3: Open on Your Phone

1. Make sure Tailscale is running on your phone
2. Open your phone's browser
3. Go to: `http://YOUR-TAILSCALE-IP:99599`
   - Example: `http://100.64.1.23:99599`

That's it! The app will work on your phone.

---

## 🔧 First Time Setup

### Install Dependencies (One Time Only)

```bash
npm install
```

### Build the App (One Time Only)

```bash
npm run build
```

Or just run `node start.js` - it will build automatically if needed!

---

## 📋 What You Get

### On Your Computer
- Open: `http://localhost:99599`
- Full-screen app with live Greek transcription
- Download notes as .md or .txt
- Copy to clipboard
- Email notes to yourself

### On Your Phone (via Tailscale)
- Same app, accessible from anywhere on your Tailscale network
- Works on iOS and Android
- Responsive design for mobile
- All features work the same

### Desktop Executable (Optional)

If you want a standalone executable:

**Windows:**
```cmd
build-desktop-windows.bat
```

**Mac:**
```bash
chmod +x build-desktop-mac.sh
./build-desktop-mac.sh
```

**Linux:**
```bash
chmod +x build-desktop-linux.sh
./build-desktop-linux.sh
```

The executable will be in the `desktop-build` folder.

---

## 🎤 Using the App

1. **Choose your AI engine** in Settings:
   - **Gemini** (recommended for Greek) - Get key at https://aistudio.google.com/apikey
   - **Groq** - Get key at https://console.groq.com/keys
   - **Mistral** - Get key at https://console.mistral.ai/api-keys/
   - **Browser** - No key needed (lower quality)

2. **Add your API key** in Settings

3. **Tap the microphone** to start recording

4. **Speak in Greek** - text appears in real-time

5. **When done:**
   - Download as .md (formatted)
   - Download as .txt (plain)
   - Copy to clipboard
   - Email to yourself

---

## 🌐 Tailscale Tips

### Why Use Tailscale?

- Access your app from anywhere (phone, tablet, other computers)
- Secure connection (encrypted)
- No port forwarding needed
- Works across different networks

### Setup Tailscale

1. Install Tailscale on your computer: https://tailscale.com/download
2. Install Tailscale on your phone: App Store / Google Play
3. Sign in with the same account on both devices
4. They're now on the same virtual network!

### Find Your Tailscale IP

**On computer:**
```bash
tailscale ip -4
```

**On phone:**
- Open Tailscale app
- Your IP is shown at the top

### Access the App

From any device on your Tailscale network:
```
http://YOUR-TAILSCALE-IP:99599
```

---

## 🔥 Troubleshooting

### "Port 99599 already in use"

Another app is using port 99599. Either:
- Stop that app, or
- Edit `server.js` and change the PORT variable

### Can't access from phone

1. Make sure Tailscale is running on both devices
2. Check firewall settings (allow port 99599)
3. Try accessing from computer first: `http://localhost:99599`
4. Verify Tailscale IP is correct

### Microphone not working on phone

- Must use HTTPS for microphone access
- Tailscale provides HTTPS automatically via MagicDNS
- Or use the app on your computer where localhost works

### App not loading

- Check if server is running (you should see the startup message)
- Try refreshing the page
- Check browser console for errors (F12)

---

## 📦 File Structure

```
your-app/
├── start.js              # Universal launcher (run this!)
├── start-windows.bat     # Windows launcher
├── start-mac-linux.sh    # Mac/Linux launcher
├── server.js             # HTTP server (port 99599)
├── dist/                 # Built app (created automatically)
├── src/                  # Source code
└── package.json          # Dependencies
```

---

## ✨ Quick Reference

### Start the app
```bash
node start.js
```

### Access on computer
```
http://localhost:99599
```

### Access on phone (via Tailscale)
```
http://YOUR-TAILSCALE-IP:99599
```

### Stop the server
```
Press Ctrl+C
```

### Rebuild the app
```bash
npm run build
```

---

## 🎯 That's It!

You're ready to go. Just run:

```bash
node start.js
```

Then open the app on your computer or phone and start taking voice notes in Greek!

Καλή επιτυχία! (Good luck!)
