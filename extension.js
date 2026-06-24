import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Background from 'resource:///org/gnome/shell/ui/background.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class BlurTheQSExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._connections = [];
        // actor -> { origStyle, blurActor, bgManager, allocId, monitor, inset }
        this._blurred = new Map();
        this._hookedMenus = new Set();

        this._loadBlurParams();
        this._apply();

        this._settingsId = this._settings.connect('changed', () => this._reload());
    }

    disable() {
        if (this._settingsId) {
            this._settings.disconnect(this._settingsId);
            this._settingsId = null;
        }
        this._removeAll();
        this._settings = null;
    }

    _loadBlurParams() {
        this._sigma = this._settings.get_int('sigma');
        this._brightness = this._settings.get_double('brightness');
        this._opacity = this._settings.get_int('opacity');
    }

    // --- Apply / reload / remove ---

    _apply() {
        if (this._settings.get_boolean('blur-osd'))
            this._blurOsd();
        if (this._settings.get_boolean('blur-notifications'))
            this._blurNotifications();
        if (this._settings.get_boolean('blur-panel-popups'))
            this._blurPanelPopups();
    }

    _reload() {
        this._removeAll();
        this._loadBlurParams();
        this._apply();
    }

    _removeAll() {
        for (const actor of [...this._blurred.keys()])
            this._removeEffect(actor);

        for (const { object, id } of this._connections) {
            try { object.disconnect(id); } catch (_) {}
        }
        this._connections = [];

        for (const menu of this._hookedMenus) {
            delete menu._blurtheqsHooked;
            // Restore BoxPointer Cairo background if a popup was left open
            this._restoreBoxPointerBg(menu);
        }
        this._hookedMenus.clear();
    }

    // --- Core blur helpers ---

    // Places a blurred GNOME wallpaper widget (BackgroundManager + Shell.BlurEffect)
    // behind the target actor. inset shrinks the clip on each side to match the
    // actor's CSS border-radius, preventing blur from bleeding into transparent corners.
    _addEffect(actor, monitorIndex = null, inset = 0) {
        if (!actor) return;
        this._removeEffect(actor);

        if (monitorIndex === null)
            monitorIndex = this._getMonitorIndex(actor);

        const monitor = Main.layoutManager.monitors[monitorIndex];

        const blurActor = new St.Widget({
            x: monitor.x,
            y: monitor.y,
            width: monitor.width,
            height: monitor.height,
        });

        const bgManager = new Background.BackgroundManager({
            container: blurActor,
            monitorIndex,
            controlPosition: false,
        });

        const context = St.ThemeContext.get_for_stage(global.stage);
        blurActor.add_effect_with_name('blur', new Shell.BlurEffect({
            radius: this._sigma * context.scale_factor,
            brightness: this._brightness,
        }));

        Main.uiGroup.insert_child_at_index(blurActor, 0);
        this._updateClip(blurActor, actor, monitor, inset);

        const allocId = actor.connect('notify::allocation', () => {
            this._updateClip(blurActor, actor, monitor, inset);
        });

        // Make the actor's background transparent so the blur shows through
        const origStyle = actor.style ?? '';
        const stripped = origStyle
            .replace(/-arrow-background-color\s*:[^;]*;?\s*/gi, '')
            .replace(/background(-color)?\s*:[^;]*;?\s*/gi, '')
            .trim();
        const alpha = (this._opacity / 255).toFixed(3);
        const overlay = `rgba(0,0,0,${alpha})`;
        actor.style = [
            `background-color: ${overlay}`,
            `-arrow-background-color: ${overlay}`,
            stripped,
        ].filter(Boolean).join('; ');

        this._blurred.set(actor, { origStyle, blurActor, bgManager, allocId, monitor, inset });
    }

    _removeEffect(actor) {
        const state = this._blurred.get(actor);
        if (!state) return;
        try { actor.disconnect(state.allocId); } catch (_) {}
        try { state.bgManager.destroy(); } catch (_) {}
        try { state.blurActor.destroy(); } catch (_) {}
        try { actor.style = state.origStyle; } catch (_) {}
        this._blurred.delete(actor);
    }

    _updateClip(blurActor, targetActor, monitor, inset = 0) {
        const [absX, absY] = targetActor.get_transformed_position();
        const [w, h] = targetActor.get_transformed_size();
        if (w > 0 && h > 0)
            blurActor.set_clip(
                absX - monitor.x + inset,
                absY - monitor.y + inset,
                Math.max(0, w - 2 * inset),
                Math.max(0, h - 2 * inset)
            );
    }

    _getMonitorIndex(actor) {
        const [x, y] = actor.get_transformed_position();
        const [w, h] = actor.get_transformed_size();
        const cx = x + w / 2;
        const cy = y + h / 2;
        for (let i = 0; i < Main.layoutManager.monitors.length; i++) {
            const m = Main.layoutManager.monitors[i];
            if (cx >= m.x && cx < m.x + m.width && cy >= m.y && cy < m.y + m.height)
                return i;
        }
        return Main.layoutManager.primaryIndex;
    }

    _track(object, id) {
        this._connections.push({ object, id });
    }

    // --- OSD ---

    _blurOsd() {
        const osdWindows = Main.osdWindowManager?._osdWindows;
        if (!osdWindows) return;

        const osdBox = osd => osd._hbox ?? osd._box ?? osd;

        for (const osd of osdWindows) {
            const monitorIndex = osd._monitorIndex ?? 0;
            this._track(osd, osd.connect('notify::visible', () => {
                const box = osdBox(osd);
                if (osd.visible)
                    this._addEffect(box, monitorIndex);
                else
                    this._removeEffect(box);
            }));
            if (osd.visible)
                this._addEffect(osdBox(osd), monitorIndex);
        }
    }

    // --- Notifications ---

    _blurNotifications() {
        const tray = Main.messageTray;
        if (!tray?._bannerBin) return;

        const bin = tray._bannerBin;
        const primaryIdx = Main.layoutManager.primaryIndex;

        if (tray._banner)
            this._blurBanner(tray._banner, primaryIdx);

        this._track(bin, bin.connect('child-added', (_, banner) => {
            this._blurBanner(banner, primaryIdx);
        }));
    }

    _blurBanner(banner, monitorIndex) {
        this._addEffect(banner, monitorIndex);
        this._track(banner, banner.connect('destroy', () => this._removeEffect(banner)));
    }

    // --- Panel pop-ups ---

    _blurPanelPopups() {
        const statusArea = Main.panel?.statusArea;
        if (!statusArea) return;

        for (const button of Object.values(statusArea))
            if (button?.menu)
                this._hookMenu(button.menu);

        this._track(
            Main.extensionManager,
            Main.extensionManager.connect('extension-state-changed', () => {
                for (const button of Object.values(Main.panel.statusArea))
                    if (button?.menu && !button.menu._blurtheqsHooked)
                        this._hookMenu(button.menu);
            })
        );
    }

    _hookMenu(menu) {
        if (menu._blurtheqsHooked) return;
        menu._blurtheqsHooked = true;
        this._hookedMenus.add(menu);

        this._track(menu, menu.connect('open-state-changed', (_menu, open) => {
            const boxPointer = _menu._boxPointer;
            const box = _menu.box;

            if (open) {
                // Apply blur to menu.box — the actual rounded visual area.
                // The rounded corners come from its CSS border-radius (e.g. 36px for
                // Quick Settings). Insetting the clip by that radius ensures the blur
                // only shows inside the rounded area, not in the transparent corner
                // cut-outs outside the rounded rectangle.
                if (box) {
                    let inset = 0;
                    try {
                        inset = box.get_theme_node().get_border_radius(St.Corner.TOPLEFT);
                    } catch (_) {}
                    this._addEffect(box, null, inset);
                }

                // Clear the BoxPointer's Cairo-drawn bubble background separately,
                // so it doesn't cover the blur in the space between _boxPointer
                // and menu.box edges (padding/arrow-rise area).
                this._clearBoxPointerBg(boxPointer, _menu);
            } else {
                if (box) this._removeEffect(box);
                this._restoreBoxPointerBg(_menu);
            }
        }));
    }

    // Makes the BoxPointer's Cairo-drawn background transparent without going
    // through _addEffect (since the blur is applied to menu.box, not _boxPointer).
    _clearBoxPointerBg(boxPointer, menu) {
        if (!boxPointer) return;
        const orig = boxPointer.style ?? '';
        const stripped = orig
            .replace(/-arrow-background-color\s*:[^;]*;?\s*/gi, '')
            .trim();
        boxPointer.style = stripped
            ? `-arrow-background-color: transparent; ${stripped}`
            : '-arrow-background-color: transparent';
        menu._blurtheqsBpOrigStyle = orig;
    }

    _restoreBoxPointerBg(menu) {
        const boxPointer = menu._boxPointer;
        if (!boxPointer || menu._blurtheqsBpOrigStyle === undefined) return;
        try { boxPointer.style = menu._blurtheqsBpOrigStyle; } catch (_) {}
        delete menu._blurtheqsBpOrigStyle;
    }
}
