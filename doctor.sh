#!/usr/bin/env bash
# ==============================================================================
# Constant — Diagnostic Health & System Audit Tool (doctor.sh)
# Inspects environment health, dependency versions, security vulnerabilities,
# compilation status, and local/cloud AI services.
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BOLD}${CYAN}"
echo "===================================================================="
echo "       CONSTANT — SYSTEM DIAGNOSTIC HEALTH CHECK (DOCTOR)"
echo "===================================================================="
echo -e "${NC}"

FAILURES=0

check_cmd() {
    local cmd="$1"
    local desc="$2"
    if command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}[PASS] ${desc}: $(command -v "$cmd")${NC}"
    else
        echo -e "${RED}[FAIL] ${desc} ('${cmd}') is missing.${NC}"
        ((FAILURES++))
    fi
}

# 1. System Tools Check
echo -e "${BOLD}--- 1. System Prerequisite Tools ---${NC}"
check_cmd "python3" "Python 3 Runtime"
check_cmd "node" "Node.js Engine"
check_cmd "npm" "npm Package Manager"
check_cmd "git" "Git Version Control"

# 2. Python Module Check
echo -e "\n${BOLD}--- 2. Python Environment & Pip ---${NC}"
if python3 -m pip --version >/dev/null 2>&1; then
    echo -e "${GREEN}[PASS] Python pip module active: $(python3 -m pip --version | head -n 1)${NC}"
else
    echo -e "${RED}[FAIL] Python pip module is missing or corrupted.${NC}"
    ((FAILURES++))
fi

# 3. Node & Dependency Audit
echo -e "\n${BOLD}--- 3. Dependency & Security Audit ---${NC}"
if npm audit --audit-level=high >/dev/null 2>&1; then
    echo -e "${GREEN}[PASS] npm Audit Security: 0 High/Critical Vulnerabilities${NC}"
else
    echo -e "${YELLOW}[WARN] npm Audit found potential vulnerabilities. Run 'npm audit' for details.${NC}"
fi

# 4. TypeScript Compilation & Bundle Build Test
echo -e "\n${BOLD}--- 4. Code Quality & Build Checks ---${NC}"
if npx tsc --noEmit >/dev/null 2>&1; then
    echo -e "${GREEN}[PASS] TypeScript Typecheck ('npx tsc --noEmit'): 0 errors${NC}"
else
    echo -e "${RED}[FAIL] TypeScript compilation errors detected. Run 'npx tsc --noEmit' for details.${NC}"
    ((FAILURES++))
fi

if npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}[PASS] Production Static Bundle ('npm run build'): Succeeded${NC}"
else
    echo -e "${RED}[FAIL] Production bundle build failed.${NC}"
    ((FAILURES++))
fi

# 5. Terminal CLI Command & PATH Integration
echo -e "\n${BOLD}--- 5. Launcher & Icon Integration ---${NC}"
if [ -L "$HOME/.local/bin/constant" ] || [ -f "$HOME/.local/bin/constant" ]; then
    echo -e "${GREEN}[PASS] Terminal command 'constant' registered in $HOME/.local/bin/constant${NC}"
else
    echo -e "${YELLOW}[WARN] 'constant' command missing. Run ./install.sh to fix.${NC}"
fi
if [ "$(uname -s)" = "Linux" ]; then
    if [ -f "$HOME/.local/share/applications/constant.desktop" ]; then echo -e "${GREEN}[PASS] Application menu entry with icon: constant.desktop${NC}"; else echo -e "${YELLOW}[WARN] No menu/desktop icon yet. Run: bash desktop/register-launcher.sh${NC}"; fi
fi

# 6. AI Engine Services Check
echo -e "\n${BOLD}--- 6. AI Engine Services ---${NC}"
if command -v ollama >/dev/null 2>&1; then
    echo -e "${GREEN}[PASS] Ollama CLI installed: $(command -v ollama)${NC}"
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}[PASS] Ollama Local Service (http://localhost:11434): Active & responding${NC}"
    else
        echo -e "${YELLOW}[INFO] Ollama service not running on port 11434. Start with 'ollama serve'.${NC}"
    fi
else
    echo -e "${YELLOW}[INFO] Ollama not installed. Built-in Offline Engine and Generic Cloud AI Providers remain available.${NC}"
fi

echo -e "\n${BOLD}===================================================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}  ✓ SYSTEM DIAGNOSTICS HEALTHY — 0 FAILS DETECTED!${NC}"
else
    echo -e "${RED}  ! DIAGNOSTICS DETECTED ${FAILURES} ISSUE(S). Run ./install.sh to remediate.${NC}"
fi
echo -e "====================================================================\n"
