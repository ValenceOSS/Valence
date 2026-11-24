import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AndroidConfig,
  withAndroidStyles,
  withDangerousMod,
  withXcodeProject,
} from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const ACCENT = 'AccentColor';

const ANDROID_TINTS = ['colorAccent', 'colorControlActivated'] as const;

/**
 * The colour set Xcode reads a tint from, for a colour written `#rrggbb`.
 *
 * @param hex - The colour.
 * @returns The set's `Contents.json`.
 */
const colourSetOf = (hex: string): string => {
  const channel = (at: number): string =>
    (Number.parseInt(hex.slice(at, at + 2), 16) / 255).toFixed(3);

  return `${JSON.stringify(
    {
      colors: [
        {
          idiom: 'universal',
          color: {
            'color-space': 'srgb',
            components: { red: channel(1), green: channel(3), blue: channel(5), alpha: '1.000' },
          },
        },
      ],
      info: { author: 'valence', version: 1 },
    },
    null,
    2,
  )}\n`;
};

/**
 * Tints what the system draws for the app in its primary colour rather than the system's blue, such
 * as the text cursor, the search field and a selection. On tvOS the colour becomes the app's accent
 * colour, which UIKit tints with before anything says otherwise; on Android TV it becomes the accent
 * the theme's controls are activated in.
 *
 * @param config - The app's config, whose `primaryColor` is the tint.
 * @returns The config, set to tint in it.
 */
const withPrimaryColourAsTint: ConfigPlugin = (config) => {
  const tint = config.primaryColor ?? '#ffffff';

  const withTheIosAccent = withXcodeProject(
    withDangerousMod(config, [
      'ios',
      (asked) => {
        const colourSet = join(
          asked.modRequest.platformProjectRoot,
          asked.modRequest.projectName ?? '',
          'Images.xcassets',
          `${ACCENT}.colorset`,
        );

        mkdirSync(colourSet, { recursive: true });
        writeFileSync(join(colourSet, 'Contents.json'), colourSetOf(tint));

        return Promise.resolve(asked);
      },
    ]),
    (asked) => {
      const configurations = asked.modResults.pbxXCBuildConfigurationSection();

      for (const configuration of Object.values(configurations)) {
        if (
          typeof configuration === 'object' &&
          typeof configuration.buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME === 'string'
        ) {
          configuration.buildSettings.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = ACCENT;
        }
      }

      return asked;
    },
  );

  return withAndroidStyles(withTheIosAccent, (asked) => {
    for (const name of ANDROID_TINTS) {
      asked.modResults = AndroidConfig.Styles.assignStylesValue(asked.modResults, {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        name,
        value: '@color/colorPrimary',
      });
    }

    return asked;
  });
};

export { withPrimaryColourAsTint };
