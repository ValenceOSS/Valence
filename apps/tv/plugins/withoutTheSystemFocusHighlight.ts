import { AndroidConfig, withAndroidStyles } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

/**
 * Stops Android TV laying its own grey highlight over whatever has focus.
 *
 * Android draws a translucent box over any focused view that does not say how it looks focused, and
 * on a television every button, card and tab is focused in turn. The television app draws its own
 * focus — the white pill, the lifted card — as tvOS lets it, so the system's box only sits on top of
 * that as a grey square with dotted corners.
 *
 * @param config - The app's config.
 * @returns The config, with the app's theme turning the highlight off.
 */
const withoutTheSystemFocusHighlight: ConfigPlugin = (config) =>
  withAndroidStyles(config, (asked) => {
    asked.modResults = AndroidConfig.Styles.assignStylesValue(asked.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:defaultFocusHighlightEnabled',
      value: 'false',
    });

    return asked;
  });

export { withoutTheSystemFocusHighlight };
