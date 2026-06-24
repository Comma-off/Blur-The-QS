#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="blurtheqs@Comma"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

# --- Dependency check ---
if ! command -v glib-compile-schemas &>/dev/null; then
    echo "Error: glib-compile-schemas not found."
    echo "Install it with:  sudo pacman -S glib2       (Arch)"
    echo "                  sudo apt install libglib2.0-bin  (Debian/Ubuntu)"
    exit 1
fi

# --- Install ---
echo "Installing $EXTENSION_UUID to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR/schemas"

cp metadata.json extension.js prefs.js "$INSTALL_DIR/"
cp schemas/org.gnome.shell.extensions.blurtheqs.gschema.xml "$INSTALL_DIR/schemas/"
glib-compile-schemas "$INSTALL_DIR/schemas/"

echo "Done."
echo ""
echo "Restart GNOME Shell to pick up the extension:"
echo "  X11    - press Alt+F2, type  r  and press Enter"
echo "  Wayland - log out and log back in"
echo ""
echo "Then enable it:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "Open preferences:"
echo "  gnome-extensions prefs $EXTENSION_UUID"
