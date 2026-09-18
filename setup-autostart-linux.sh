#!/bin/bash

# ============================================
#  Setup Auto-Start for Φωνή on Linux
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Setting up auto-start for Φωνή (Foni)                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Get the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create autostart desktop file
AUTOSTART_DIR="$HOME/.config/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/foni-voice-notes.desktop"

echo "Creating autostart entry..."
echo ""

# Create autostart directory if it doesn't exist
mkdir -p "$AUTOSTART_DIR"

# Create the desktop file
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Type=Application
Name=Φωνή - Greek Voice Notes
Comment=Live Greek speech transcription
Exec=/bin/bash ${CURRENT_DIR}/start-mac-linux.sh
Path=${CURRENT_DIR}
Terminal=true
StartupNotify=false
X-GNOME-Autostart-enabled=true
EOF

if [ $? -eq 0 ]; then
    echo "✅ Success! Auto-start configured."
    echo ""
    echo "The app will now start automatically when you log in."
    echo "Desktop entry created at: $DESKTOP_FILE"
    echo ""
    echo "To disable auto-start:"
    echo "  rm $DESKTOP_FILE"
    echo ""
    echo "Or use your desktop environment's startup applications settings."
    echo ""
    
    # Ask if user wants to start it now
    read -p "Would you like to start the app now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nohup /bin/bash "${CURRENT_DIR}/start-mac-linux.sh" > /dev/null 2>&1 &
        echo "✅ App started in background!"
    fi
else
    echo "❌ Failed to create desktop entry."
    echo ""
fi
