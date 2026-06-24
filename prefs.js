import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class BlurTheQSPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        window.set_default_size(620, 500);
        window.set_title(_('Blur the QS'));

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // -- Blur Targets --
        const targetsGroup = new Adw.PreferencesGroup({
            title: _('Blur Targets'),
            description: _('Choose which shell elements to blur'),
        });
        page.add(targetsGroup);

        const osdRow = new Adw.SwitchRow({
            title: _('OSD Pop-ups'),
            subtitle: _('Volume, brightness, and other on-screen indicators'),
        });
        settings.bind('blur-osd', osdRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        targetsGroup.add(osdRow);

        const notifRow = new Adw.SwitchRow({
            title: _('Notification Pop-ups'),
            subtitle: _('Notification banners that appear at the top of the screen'),
        });
        settings.bind('blur-notifications', notifRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        targetsGroup.add(notifRow);

        const panelRow = new Adw.SwitchRow({
            title: _('Panel Pop-ups'),
            subtitle: _('Calendar, Quick Settings, and other panel button menus'),
        });
        settings.bind('blur-panel-popups', panelRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        targetsGroup.add(panelRow);

        // -- Blur Parameters --
        const blurGroup = new Adw.PreferencesGroup({
            title: _('Blur Parameters'),
        });
        page.add(blurGroup);

        const sigmaRow = new Adw.SpinRow({
            title: _('Blur Radius'),
            subtitle: _('Gaussian sigma - higher means more blur'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1,
                page_increment: 5,
            }),
        });
        settings.bind('sigma', sigmaRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        blurGroup.add(sigmaRow);

        const brightnessRow = new Adw.SpinRow({
            title: _('Brightness'),
            subtitle: _('0.0 = darkened - 1.0 = full brightness'),
            digits: 2,
            adjustment: new Gtk.Adjustment({
                lower: 0.0,
                upper: 1.0,
                step_increment: 0.05,
                page_increment: 0.1,
            }),
        });
        settings.bind('brightness', brightnessRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        blurGroup.add(brightnessRow);

        const opacityRow = new Adw.SpinRow({
            title: _('Overlay Opacity'),
            subtitle: _('0 = transparent (blur only) - 255 = fully opaque dark overlay'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 255,
                step_increment: 5,
                page_increment: 25,
            }),
        });
        settings.bind('opacity', opacityRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        blurGroup.add(opacityRow);
    }
}
