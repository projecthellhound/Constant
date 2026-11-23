#!/usr/bin/env bash
# ==============================================================================
# Constant — Automated Repository Update & Maintenance Script
# Performs git synchronization, updates dependencies, rebuilds bundles,
# and verifies terminal command integration.
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}"
echo "===================================================================="
echo "          HABIT OS — REPOSITORY UPDATE & REBUILD"
echo "===================================================================="
echo -e "${NC}"

echo -e "${BOLD}[1/4] Pulling Latest Changes from Git Remote...${NC}"
git pull origin main || echo -e "${YELLOW}[!] Note: git pull completed or skipped.${NC}"

echo -e "\n${BOLD}[2/4] Updating Dependencies...${NC}"
python3 -m pip install -r requirements.txt --quiet || true
npm install --no-fund --quiet

echo -e "\n${BOLD}[3/4] Rebuilding Production Bundle...${NC}"
npm run build

echo -e "\n${BOLD}[4/4] Verifying the Constant launcher...${NC}"
chmod +x bin/constant bin/Habit desktop/register-launcher.sh
USER_BIN="$HOME/.local/bin"
mkdir -p "$USER_BIN"
ln -sf "$SCRIPT_DIR/bin/constant" "$USER_BIN/constant"
ln -sf "$SCRIPT_DIR/bin/Habit" "$USER_BIN/Habit"
[ "$(uname -s)" = "Linux" ] && bash "$SCRIPT_DIR/desktop/register-launcher.sh"

echo -e "\n${GREEN}${BOLD}===================================================================="
echo "  ✓ CONSTANT UPDATED SUCCESSFULLY!"
echo "====================================================================\n${NC}"
