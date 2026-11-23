#!/usr/bin/env bash
# ==============================================================================
# Constant — Clean Uninstallation & Artifact Cleanup Script
# Removes symlinks from executable PATH and cleans build artifacts.
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${YELLOW}"
echo "===================================================================="
echo "         HABIT OS — UNINSTALLATION & CLEANUP TOOL"
echo "===================================================================="
echo -e "${NC}"

read -p "Are you sure you want to uninstall the Constant launcher and clean build outputs? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo -e "\n[*] Removing terminal launcher symlinks..."
rm -f "$HOME/.local/bin/Habit" "$HOME/.local/bin/constant" "$HOME/.local/share/applications/constant.desktop" "$HOME/Desktop/Constant.desktop"
for s in 16 24 32 48 64 128 256 512; do rm -f "$HOME/.local/share/icons/hicolor/${s}x${s}/apps/constant.png"; done
for f in /usr/local/bin/Habit /usr/local/bin/constant; do [ -w "$f" ] && rm -f "$f"; done

echo -e "[*] Cleaning build output directories (dist, dist_electron)..."
rm -rf dist dist_electron

echo -e "\n${GREEN}${BOLD}===================================================================="
echo "  ✓ CONSTANT UNINSTALLED & CLEANED SUCCESSFULLY"
echo "====================================================================\n${NC}"
