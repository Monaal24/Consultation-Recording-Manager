@echo off
:: ==============================================================================
:: CRM.ai Windows Local Launcher Script
:: ==============================================================================

title CRM.ai Local Server Core Launcher
cls
echo =====================================================
echo       🚀 CRM.ai - Consultation Recording Manager       
echo =====================================================
echo Starting system verification and development servers...
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found on your system.
    echo Please install Node.js (Version 18 or higher) from: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js is installed: %NODE_VERSION%
)

:: 2. Setup Environment Variables (.env check)
if not exist .env (
    echo [INFO] Creating configuration .env file from .env.example...
    copy .env.example .env >nul
    echo [OK] .env file created.
    echo [WARNING] Please open '.env' in VS Code and paste your GEMINI_API_KEY!
) else (
    echo [OK] Configuration .env file found.
)

:: 3. Check and Install Node Modules
if not exist node_modules (
    echo [INFO] Node modules folder missing. Installing dependencies (this may take a moment)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered problems.
        pause
        exit /b 1
    )
    echo [OK] Dependencies successfully installed.
) else (
    echo [OK] Dependencies folder found.
)

:: 4. Verify/Create database folder
if not exist .data\db.json (
    echo [INFO] Database will be seeded upon server boot!
)

echo.
echo [SUCCESS] All checks passed! Booting server now...
echo ========================================================================
echo 👉 Open your browser at: http://localhost:3000
echo 🔑 Default Email:       demo@consult.com
echo 🔑 Default Password:    password123
echo ========================================================================
echo Press [Ctrl + C] anytime to stop the server.
echo.

:: Run development script
call npm run dev
pausing
