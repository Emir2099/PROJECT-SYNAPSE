@echo off
REM Project Synapse - Windows Build Script
REM This script builds the application for Windows distribution

echo.
echo ========================================
echo    PROJECT SYNAPSE - Build for Windows
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [!] Dependencies not found!
    echo [*] Installing dependencies...
    echo.
    call npm install
    echo.
    if errorlevel 1 (
        echo [X] Installation failed!
        pause
        exit /b 1
    )
)

echo [*] Building Project Synapse for Windows...
echo [*] This may take a few minutes...
echo.

call npm run build:win

if errorlevel 1 (
    echo.
    echo [X] Build failed!
    echo [*] Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo [✓] Build completed successfully!
echo ========================================
echo.
echo Your application is ready in the 'dist' folder:
echo.
dir /B dist\*.exe 2>nul
echo.
echo You can now distribute this installer to other computers.
echo.
pause
