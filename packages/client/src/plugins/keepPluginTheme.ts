import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { KEPT_PLUGIN_THEME_KEY } from '@ValenceClient/plugins/KEPT_PLUGIN_THEME_KEY';
import type { PluginTheme } from '@ValenceSDK/theme/PluginThemeSchema';

/**
 * Keeps a chosen plugin theme's colours on this device, beside the choice itself, for a client that
 * has to draw in them before it can ask the server: a phone opening, or a television whose colours
 * are settled before its first screen is built.
 *
 * @param pluginId - The plugin the theme is from.
 * @param theme - The theme, or nothing to forget the colours kept.
 */
const keepPluginTheme = (pluginId: string, theme: PluginTheme | null): void => {
  const { store } = platformInUse();

  if (theme === null) {
    store.forget(KEPT_PLUGIN_THEME_KEY);

    return;
  }

  store.write(
    KEPT_PLUGIN_THEME_KEY,
    JSON.stringify({
      choice: `${pluginId}/${theme.id}`,
      corners: theme.corners,
      ...(theme.dark === undefined ? {} : { dark: theme.dark }),
      ...(theme.light === undefined ? {} : { light: theme.light }),
    }),
  );
};

export { keepPluginTheme };
