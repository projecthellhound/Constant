#!/usr/bin/env bash
# Registers Constant in the Linux application menu with its own icon (and a Desktop shortcut when a Desktop folder exists).
set -e
ROOT="$(cd -P "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS="$HOME/.local/share/applications"; ICONS="$HOME/.local/share/icons/hicolor"
mkdir -p "$APPS"
for s in 16 24 32 48 64 128 256 512; do
  mkdir -p "$ICONS/${s}x${s}/apps"; cp "$ROOT/build/icons/${s}x${s}.png" "$ICONS/${s}x${s}/apps/constant.png"
done
sed "s|@LAUNCHER@|$ROOT/bin/constant|" "$ROOT/desktop/constant.desktop.template" > "$APPS/constant.desktop"
chmod +x "$APPS/constant.desktop"
chmod +x "$ROOT/bin/constant" "$ROOT/bin/Habit" 2>/dev/null || true
DESK="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
if [ -d "$DESK" ]; then
  cp "$APPS/constant.desktop" "$DESK/Constant.desktop"; chmod +x "$DESK/Constant.desktop"
  # GNOME/Nautilus: mark the shortcut as trusted so it launches instead of showing "Untrusted/Broken Desktop File".
  command -v gio >/dev/null 2>&1 && gio set "$DESK/Constant.desktop" metadata::trusted true >/dev/null 2>&1 || true
fi
command -v desktop-file-validate >/dev/null 2>&1 && desktop-file-validate "$APPS/constant.desktop" || true
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APPS" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "$ICONS" >/dev/null 2>&1 || true
echo "[✓] Constant added to your application menu (search for \"Constant\")."
