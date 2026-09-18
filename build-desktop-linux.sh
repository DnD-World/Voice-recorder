#!/bin/bash

echo "============================================"
echo " Building Desktop Executable for Linux"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    exit 1
fi

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 2: Building web app..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build web app"
    exit 1
fi

echo ""
echo "Step 3: Installing Electron and packager..."
npm install --save-dev electron electron-packager
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Electron"
    exit 1
fi

echo ""
echo "Step 4: Packaging desktop app..."
npx electron-packager . Foni --platform=linux --arch=x64 --out=desktop-build --overwrite --icon=public/icon-512.png
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to package desktop app"
    exit 1
fi

echo ""
echo "============================================"
echo " SUCCESS! Desktop app created!"
echo "============================================"
echo ""
echo "Your executable is in: desktop-build/Foni-linux-x64/"
echo ""
echo "You can copy this folder to any Linux PC"
echo "and run the Foni executable directly!"
echo ""
echo "To make it executable:"
echo "  chmod +x desktop-build/Foni-linux-x64/Foni"
echo ""
