# Blur the QS

A GNOME Shell extension that blurs **OSD pop-ups** (volume, brightness), **notification banners**, and **panel pop-ups** (Quick Settings, calendar, etc.).

Blur parameters are read from [Blur my Shell](https://github.com/aunetx/blur-my-shell)'s **Applications** tab so the look stays consistent across your desktop - or you can set them independently.

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

This is the same concept as the **Opacity** slider in BMS's Applications tab.

---

## How it works (non-destructive)

This extension **does not modify any GNOME Shell files**. It works entirely through the standard extension API, the same way Blur my Shell does:

| What | How | Cleaned up on disable |
|------|-----|-----------------------|
| Blur effect | `actor.add_effect_with_name(..., Shell.BlurEffect)` | `actor.remove_effect_by_name(...)` |
| Transparent background | `actor.style = 'background-color: rgba(...)'` | Original `actor.style` restored |
| Signal connections | `object.connect(signal, handler)` | `object.disconnect(id)` |

`Shell.BlurEffect` with `Shell.BlurMode.BACKGROUND` blurs the compositor content *behind* each actor without affecting any other part of the shell. All changes are runtime-only and vanish the moment the extension is disabled.

---

## Uninstall

```bash
gnome-extensions disable blurtheqs@Comma
rm -rf ~/.local/share/gnome-shell/extensions/blurtheqs@Comma
```

---

## License

MIT
