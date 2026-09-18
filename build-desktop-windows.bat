@echo off
echo ============================================
echo  Building Desktop Executable for Windows
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building web app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build web app
    pause
    exit /b 1
)

echo.
echo Step 3: Installing Electron and packager...
call npm install --save-dev electron electron-packager
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install Electron
    pause
    exit /b 1
)

echo.
echo Step 4: Packaging desktop app...
call npx electron-packager . Foni --platform=win32 --arch=x64 --out=desktop-build --overwrite --icon=public/icon-512.png
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to package desktop app
    pause
    exit /b 1
)

echo.
echo ============================================
echo  SUCCESS! Desktop app created!
echo ============================================
echo.
echo Your executable is in: desktop-build\Foni-win32-x64\
echo.
echo You can copy this folder to any Windows PC
echo and run Foni.exe directly - no installation needed!
echo.
pause
