@echo off
REM ============================================
REM  Setup Auto-Start for Φωνή on Windows
REM ============================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  Setting up auto-start for Φωνή (Foni)                ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Get the current directory
set CURRENT_DIR=%~dp0

REM Create startup shortcut
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_FOLDER%\Foni-Voice-Notes.lnk

echo Creating startup shortcut...
echo.

REM Use PowerShell to create shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%CURRENT_DIR%start-windows.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.IconLocation = '%CURRENT_DIR%public\icon-512.png,0'; $Shortcut.Description = 'Φωνή - Greek Voice Notes'; $Shortcut.Save()"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Success! Auto-start configured.
    echo.
    echo The app will now start automatically when you log in.
    echo Shortcut created at: %SHORTCUT_PATH%
    echo.
    echo To disable auto-start, delete the shortcut from:
    echo   %STARTUP_FOLDER%
    echo.
) else (
    echo.
    echo ❌ Failed to create shortcut.
    echo Please try running this script as Administrator.
    echo.
)

pause
