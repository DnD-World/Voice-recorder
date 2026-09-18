#!/bin/bash

# ============================================
#  Setup Auto-Start for Φωνή on macOS
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Setting up auto-start for Φωνή (Foni)                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Get the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create LaunchAgent plist
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.foni.voicenotes.plist"

echo "Creating LaunchAgent..."
echo ""

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$PLIST_DIR"

# Create the plist file
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.foni.voicenotes</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${CURRENT_DIR}/start-mac-linux.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${CURRENT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${CURRENT_DIR}/foni.log</string>
    <key>StandardErrorPath</key>
    <string>${CURRENT_DIR}/foni-error.log</string>
</dict>
</plist>
EOF

if [ $? -eq 0 ]; then
    echo "✅ Success! Auto-start configured."
    echo ""
    echo "The app will now start automatically when you log in."
    echo "LaunchAgent created at: $PLIST_FILE"
    echo ""
    echo "To disable auto-start:"
    echo "  launchctl unload $PLIST_FILE"
    echo ""
    echo "To manually start now:"
    echo "  launchctl load $PLIST_FILE"
    echo ""
    
    # Ask if user wants to load it now
    read -p "Would you like to start the app now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        launchctl load "$PLIST_FILE"
        echo "✅ App started!"
    fi
else
    echo "❌ Failed to create LaunchAgent."
    echo ""
fi
