@echo off
REM Project Synapse - Windows Run Script
REM This script makes it easy to run the application on Windows

echo.
echo ========================================
echo    PROJECT SYNAPSE - Desktop App
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
        echo [*] Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo [✓] Dependencies installed successfully!
    echo.
)

REM Run the application
echo [*] Starting Project Synapse...
echo.
call npm start

REM If the app closes
echo.
echo [*] Application closed.
pause
