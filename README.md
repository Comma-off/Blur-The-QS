# Blur the QS

A GNOME Shell extension that blurs **OSD pop-ups** (volume, brightness), **notification banners**, and **panel pop-ups** (Quick Settings, calendar, etc.).

---

## Requirements

- GNOME Shell 45-50
- [Blur my Shell](https://extensions.gnome.org/extension/3193/blur-my-shell/) *(optional - manual settings work without it)*

---

## Installation

```bash
git clone https://github.com/Comma-off/blurtheqs
cd blurtheqs
./install.sh
```

Then restart GNOME Shell:

| Session | How to restart |
|---------|----------------|
| X11     | Press **Alt+F2**, type `r`, press **Enter** |
| Wayland | Log out and log back in |

Finally, enable the extension:

```bash
gnome-extensions enable blurtheqs@Comma
```

Or use the **GNOME Extensions** app.

---

## Settings

Open preferences with:

```bash
gnome-extensions prefs blurtheqs@Comma
```

| Setting | Description |
|---------|-------------|
| **OSD Pop-ups** | Blur volume/brightness/media OSD indicators |
| **Notification Pop-ups** | Blur notification banners |
| **Panel Pop-ups** | Blur Quick Settings, calendar, and other panel menus |
| **Use Blur my Shell - Applications** | Read sigma & brightness from BMS. Greyed out if BMS is not installed. |
| **Blur Radius** | Gaussian sigma (manual mode only) |
| **Brightness** | 0.0 = dark - 1.0 = full brightness (manual mode only) |
| **Overlay Opacity** | 0-255 dark overlay on top of the blur. **Always configurable**, independent of BMS. |

### Overlay Opacity explained

The opacity adds a semi-transparent dark layer on top of the blur:

- `0` - fully transparent overlay, only the blur is visible (most see-through)
- `128` - 50% dark tint + blur (classic frosted glass)
- `255` - fully opaque black (no blur visible)
- 
---

## Uninstall

```bash
gnome-extensions disable blurtheqs@Comma
rm -rf ~/.local/share/gnome-shell/extensions/blurtheqs@Comma
```

---

## License

MIT
