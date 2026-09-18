@echo off
title Φωνή - Greek Voice Notes Server
color 0A

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║   🎤  Φωνή (Foni) - Greek Voice Notes                 ║
echo ║                                                        ║
echo ║   Starting server on port 9959...                     ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if dist folder exists
if not exist "dist" (
    echo ⚠️  Build folder not found. Building app...
    echo.
    call npm install
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error: Build failed!
        pause
        exit /b 1
    )
    echo.
    echo ✅ Build complete!
    echo.
)

REM Get Tailscale IP if available
echo 📡 Checking Tailscale connection...
for /f "tokens=*" %%i in ('tailscale ip -4 2^>nul') do set TAILSCALE_IP=%%i
if defined TAILSCALE_IP (
    echo ✅ Tailscale IP: %TAILSCALE_IP%
) else (
    echo ⚠️  Tailscale not detected (that's okay)
)
echo.

echo 🌐 Server starting...
echo.
echo ══════════════════════════════════════════════════════════
echo.
echo   Local access:    http://localhost:9959
if defined TAILSCALE_IP (
echo   Tailscale:       http://%TAILSCALE_IP%:9959
echo.
echo   📱 From your phone:
echo      Open http://%TAILSCALE_IP%:9959
)
echo.
echo ══════════════════════════════════════════════════════════
echo.
echo   Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

pause
