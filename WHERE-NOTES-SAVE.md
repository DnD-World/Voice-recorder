# 📁 Where Your Notes Are Saved

## Current Save Options

### 1. Local Auto-Save (NEW - Always Active)
**Location:** `./autosave/` folder (next to the app)

- **When:** Every checkpoint interval (default: 1 minute)
- **Format:** Markdown (.md) with timestamps
- **How:** Automatically saved by the server
- **Access:** Open the `autosave` folder to see all your notes

**Example files:**
```
autosave/
├── voice-notes-2026-01-15T14-30.md
├── voice-notes-2026-01-15T14-32.md
└── voice-notes-2026-01-15T14-34.md
```

### 2. Manual Download
**Location:** Your Downloads folder

- **When:** You click the download button
- **Format:** .md (Markdown) or .txt (Plain text)
- **How:** Click "📝 .md" or "📄 .txt" button

### 3. Copy to Clipboard
**Location:** Your clipboard

- **When:** You click the copy button
- **How:** Click "📋 Copy" button, then paste anywhere

### 4. Email to Yourself
**Location:** Your email inbox

- **When:** You click the email button
- **How:** 
  1. Enable "Email Notes" in Settings
  2. Enter your email address
  3. Click "✉️ Email" button

### 5. Google Drive (Optional - Requires Setup)
**Location:** Your Google Drive account

- **When:** Every checkpoint interval (if enabled)
- **Format:** Markdown (.md)
- **How:** 
  1. Set up OAuth credentials (see SETUP-GUIDE.md)
  2. Enable "Google Drive sync" in Settings
  3. Optionally specify a folder ID
  4. Files auto-sync to your Drive

**⚠️ Note:** Google Drive integration requires manual setup with OAuth credentials. It's not enabled by default.

---

## What's NOT Currently Saving

❌ **No automatic file save to a specific folder** (unless you use the local autosave)
❌ **No Google Drive folder by default** (requires OAuth setup)
❌ **No cloud backup by default** (you need to set it up)

---

## Recommended Workflow

### Simple Setup (No Cloud)
1. Run the app: `node start.js`
2. Speak your notes in Greek
3. Notes auto-save to `./autosave/` every minute
4. Periodically check the `autosave` folder
5. Download or copy notes when needed

### With Google Drive (Advanced)
1. Set up Google Cloud Project (see SETUP-GUIDE.md)
2. Get OAuth Client ID
3. Update the code with your Client ID
4. Enable Google Drive sync in Settings
5. Notes auto-sync to your Drive

### With Email (Simple Cloud Backup)
1. Enable "Email Notes" in Settings
2. Enter your email
3. Click "✉️ Email" to send notes to yourself
4. Notes arrive in your inbox

---

## Auto-Save Settings

In Settings, you can configure:
- **Checkpoint Interval:** How often to auto-save (30s, 1min, 2min, 5min)
- **Email Address:** Where to send notes via email
- **Google Drive Folder ID:** Specific folder for Drive sync (optional)

---

## Finding Your Auto-Saved Notes

### On Windows
```
C:\path\to\your\app\autosave\
```

### On Mac/Linux
```
/path/to/your/app/autosave/
```

### View via API
```bash
# List all auto-saved files
curl http://localhost:99599/api/autosave
```

---

## Summary

| Save Method | Where | When | Setup Required |
|-------------|-------|------|----------------|
| **Local Auto-Save** | `./autosave/` | Every checkpoint | None ✅ |
| **Manual Download** | Downloads folder | On click | None ✅ |
| **Copy to Clipboard** | Clipboard | On click | None ✅ |
| **Email** | Your inbox | On click | Email address |
| **Google Drive** | Your Drive | Every checkpoint | OAuth setup |

**Bottom line:** Your notes are automatically saved to the `autosave` folder every minute. No additional setup needed!
