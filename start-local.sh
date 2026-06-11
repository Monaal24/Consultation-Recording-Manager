#!/bin/bash

# ==============================================================================
# CRM.ai Linux/macOS Local Launcher Script
# ==============================================================================

# ANSI Color Codes for beautiful status messages
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}      🚀 CRM.ai - Consultation Recording Manager       ${NC}"
echo -e "${CYAN}=====================================================${NC}"
echo -e "Starting system verification and development servers...\n"

# 1. Verify Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js details were not found on your system.${NC}"
    echo -e "Please install Node.js (Version 18 or higher) from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}[OK] Node.js is installed: ${NODE_VERSION}${NC}"
fi

# 2. Setup Environment Variables (.env check)
if [ ! -f .env ]; then
    echo -e "${YELLOW}[INFO] Creating configuration .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}[OK] .env file created.${NC}"
    echo -e "${YELLOW}[WARNING] Don't forget to open '.env' and set your GEMINI_API_KEY for dynamic AI summaries!${NC}"
else
    echo -e "${GREEN}[OK] Configuration .env file found.${NC}"
fi

# 3. Check and Install Node Modules
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}[INFO] Node modules folder missing. Installing dependencies (this may take a moment)...${NC}"
    if npm install; then
        echo -e "${GREEN}[OK] Dependencies successfully installed.${NC}"
    else
        echo -e "${RED}[ERROR] npm install encountered problems.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[OK] Dependencies folder found.${NC}"
fi

# 4. Verify/Create database folder
if [ ! -f .data/db.json ]; then
    echo -e "${YELLOW}[INFO] Database will be seeded upon server boot!${NC}"
fi

echo -e "\n${GREEN}[SUCCESS] All checks passed! Booting server now...${NC}"
echo -e "${CYAN}========================================================================${NC}"
echo -e "👉 Open your browser at: ${YELLOW}http://localhost:3000${NC}"
echo -e "🔑 Default Email:       ${YELLOW}demo@consult.com${NC}"
echo -e "🔑 Default Password:    ${YELLOW}password123${NC}"
echo -e "${CYAN}========================================================================${NC}"
echo -e "Press [Ctrl + C] anytime to stop the server.\n"

# Run development script
npm run dev
