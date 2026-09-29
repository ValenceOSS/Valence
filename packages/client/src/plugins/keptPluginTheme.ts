import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { KEPT_PLUGIN_THEME_KEY } from '@ValenceClient/plugins/KEPT_PLUGIN_THEME_KEY';
import { KeptPluginThemeSchema } from '@ValenceClient/plugins/KeptPluginThemeSchema';
import type { KeptPluginTheme } from '@ValenceClient/plugins/KeptPluginThemeSchema';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

let lastRead: { raw: string | null; theme: KeptPluginTheme | null } = { raw: null, theme: null };

/**
 * The plugin theme colours kept on this device for a choice, read back through the theme's own
 * schema so a value written by an older build, or tampered with, is ignored rather than drawn. Only
 * colours kept for the same choice count: a choice made on another screen that has not yet had its
 * colours kept draws Valence's own until it has.
 *
 * Read on every draw, so the last value read is remembered rather than parsed again.
 *
 * @param choice - The theme chosen, written as `plugin/theme`.
 * @param store - Where to read from, where it is not the installed platform's store: a television
 *   settles its colours before the platform is installed.
 * @returns Its colours, or nothing where none are kept for it.
 */
const keptPluginTheme = (
  choice: string | null,
  store: Pick<DeviceStore, 'read'> = platformInUse().store,
): KeptPluginTheme | null => {
  if (choice === null) {
    return null;
  }

  const raw = store.read(KEPT_PLUGIN_THEME_KEY);

  if (raw !== lastRead.raw) {
    let theme: KeptPluginTheme | null = null;

    try {
      const read = raw === null ? null : KeptPluginThemeSchema.safeParse(JSON.parse(raw));

      theme = read?.success === true ? read.data : null;
    } catch {
      theme = null;
    }

    lastRead = { raw, theme };
  }

  return lastRead.theme?.choice === choice ? lastRead.theme : null;
};

export { keptPluginTheme };
