#!/usr/bin/env bash
# ==============================================================================
# Constant — Professional Installation & Setup Script
# Performs system prerequisite detection, dependency installation,
# static bundle compilation, and CLI command registration.
# ==============================================================================

set -e

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "===================================================================="
    echo "       CONSTANT — INSTALLATION & SYSTEM INITIALIZATION"
    echo "===================================================================="
    echo -e "${NC}"
}

check_prereq() {
    local tool="$1"
    local name="$2"
    if command -v "$tool" >/dev/null 2>&1; then
        echo -e "${GREEN}[✓] Found ${name}: $(command -v "$tool")${NC}"
        return 0
    else
        echo -e "${YELLOW}[!] Warning: ${name} ('${tool}') is not installed or not in PATH.${NC}"
        return 1
    fi
}

main() {
    print_header

    echo -e "${BOLD}[1/6] Validating System Prerequisites...${NC}"
    check_prereq "python3" "Python 3" || { echo -e "${RED}[!] Python 3.8+ is required.${NC}"; exit 1; }
    check_prereq "node" "Node.js" || { echo -e "${RED}[!] Node.js v18+ is required.${NC}"; exit 1; }
    check_prereq "npm" "npm Package Manager" || { echo -e "${RED}[!] npm is required.${NC}"; exit 1; }
    check_prereq "ollama" "Ollama AI Engine" || true

    echo -e "\n${BOLD}[2/6] Installing Python Setup Dependencies...${NC}"
    python3 -m pip install -r requirements.txt --quiet || python3 -m pip install -r requirements.txt

    echo -e "\n${BOLD}[3/6] Installing Node.js & Electron Dependencies...${NC}"
    npm install --no-fund --quiet

    if command -v ollama >/dev/null 2>&1; then
        echo -e "\n${BOLD}[4/6] Verifying Ollama Local Base Model...${NC}"
        ollama pull llama3.1 >/dev/null 2>&1 || echo -e "${YELLOW}[i] Could not pull llama3.1 automatically. Ensure Ollama service is running.${NC}"
    fi

    echo -e "\n${BOLD}[5/6] Building Production Bundle...${NC}"
    npm run build

    echo -e "\n${BOLD}[6/6] Registering the Constant launcher...${NC}"
    chmod +x bin/constant bin/Habit desktop/register-launcher.sh
    USER_BIN="$HOME/.local/bin"
    mkdir -p "$USER_BIN"
    ln -sf "$SCRIPT_DIR/bin/constant" "$USER_BIN/constant"
    ln -sf "$SCRIPT_DIR/bin/Habit" "$USER_BIN/Habit"   # legacy alias
    if [ "$(uname -s)" = "Linux" ]; then bash "$SCRIPT_DIR/desktop/register-launcher.sh"; fi

    if [ -w "/usr/local/bin" ]; then
        ln -sf "$SCRIPT_DIR/bin/constant" "/usr/local/bin/constant" 2>/dev/null || true
    fi

    echo -e "\n${GREEN}${BOLD}===================================================================="
    echo "  ✓ CONSTANT INSTALLED SUCCESSFULLY!"
    echo "===================================================================="
    echo -e "  - Launch from menu:     ${CYAN}Constant${NC} (application menu / desktop icon)"
    echo -e "  - Launch via Terminal:   ${CYAN}constant${NC}"
    echo -e "  - Launch Web Mode:       ${CYAN}npm run dev${NC}"
    echo -e "  - Launch Desktop App:   ${CYAN}npm run electron:dev${NC}"
    echo -e "  - Run System Doctor:    ${CYAN}./doctor.sh${NC}"
    echo -e "====================================================================\n${NC}"
}

main "$@"
