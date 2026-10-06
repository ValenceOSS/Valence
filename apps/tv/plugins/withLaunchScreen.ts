import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AndroidConfig,
  withAndroidColors,
  withAndroidStyles,
  withDangerousMod,
} from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const MARKS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'launch');

const SYSTEM_GROUND = '<color key="backgroundColor" systemColor="systemBackgroundColor"/>';

const VALENCE_GROUND =
  '<color key="backgroundColor" red="0.0549" green="0.0549" blue="0.0549" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>';

const ANDROID_GROUND = '#0E0E0E';

const ANDROID_MARKS = [
  ['launch-mark.png', 'drawable-mdpi'],
  ['launch-mark@2x.png', 'drawable-xhdpi'],
] as const;

const MARK_ON_ITS_OWN = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:width="288dp" android:height="288dp">
    <shape android:shape="rectangle"><solid android:color="@android:color/transparent" /></shape>
  </item>
  <item android:width="160dp" android:height="117dp" android:gravity="center" android:drawable="@drawable/launch_mark" />
</layer-list>
`;

const MARK_ON_THE_GROUND = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background" />
  <item android:width="160dp" android:height="117dp" android:gravity="center" android:drawable="@drawable/launch_mark" />
</layer-list>
`;

const ANDROID_SPLASH = [
  ['android:windowBackground', '@drawable/launch_screen'],
  ['android:windowSplashScreenBackground', '@color/splashscreen_background'],
  ['android:windowSplashScreenAnimatedIcon', '@drawable/launch_screen_mark'],
] as const;

const IMAGE_SET = {
  images: [
    { idiom: 'tv', filename: 'launch-mark.png', scale: '1x' },
    { idiom: 'tv', filename: 'launch-mark@2x.png', scale: '2x' },
    { idiom: 'universal', filename: 'launch-mark@2x.png', scale: '2x' },
  ],
  info: { author: 'valence', version: 1 },
};

/**
 * Puts Valence's mark into the tvOS launch screen's asset catalogue and its dark ground into the
 * launch storyboard.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the tvOS launch screen dressed.
 */
const withTheIosLaunchScreen: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    (asked) => {
      const project = join(
        asked.modRequest.platformProjectRoot,
        asked.modRequest.projectName ?? '',
      );
      const imageSet = join(project, 'Images.xcassets', 'SplashScreen.imageset');

      mkdirSync(imageSet, { recursive: true });

      for (const file of ['launch-mark.png', 'launch-mark@2x.png']) {
        copyFileSync(join(MARKS, file), join(imageSet, file));
      }

      writeFileSync(join(imageSet, 'Contents.json'), `${JSON.stringify(IMAGE_SET, null, 2)}\n`);

      const storyboard = join(project, 'SplashScreen.storyboard');

      writeFileSync(
        storyboard,
        readFileSync(storyboard, 'utf8').replace(SYSTEM_GROUND, VALENCE_GROUND),
      );

      return Promise.resolve(asked);
    },
  ]);

/**
 * Draws Android TV's launch screen as Valence's mark on Valence's dark ground, where Android would
 * otherwise show its own grey screen first: the window the app opens in and the launch screen
 * Android 12 and later draw themselves, each with the mark at the size and place the app's splash
 * has it, and the dark ground alone behind the app once it runs, since the app does not paint
 * everywhere itself.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the Android launch screen dressed.
 */
const withTheAndroidLaunchScreen: ConfigPlugin = (config) =>
  withAndroidStyles(
    withAndroidColors(
      withDangerousMod(config, [
        'android',
        (asked) => {
          const resources = join(asked.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');

          for (const [file, folder] of ANDROID_MARKS) {
            mkdirSync(join(resources, folder), { recursive: true });
            copyFileSync(join(MARKS, file), join(resources, folder, 'launch_mark.png'));
          }

          writeFileSync(join(resources, 'drawable', 'launch_screen_mark.xml'), MARK_ON_ITS_OWN);
          writeFileSync(join(resources, 'drawable', 'launch_screen.xml'), MARK_ON_THE_GROUND);

          return Promise.resolve(asked);
        },
      ]),
      (asked) => {
        asked.modResults = AndroidConfig.Colors.assignColorValue(asked.modResults, {
          name: 'splashscreen_background',
          value: ANDROID_GROUND,
        });

        return asked;
      },
    ),
    (asked) => {
      for (const [name, value] of ANDROID_SPLASH) {
        asked.modResults = AndroidConfig.Styles.assignStylesValue(asked.modResults, {
          add: true,
          parent: { name: 'Theme.App.SplashScreen', parent: 'AppTheme' },
          name,
          value,
        });
      }

      asked.modResults = AndroidConfig.Styles.assignStylesValue(asked.modResults, {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:windowBackground',
        value: '@color/splashscreen_background',
      });

      return asked;
    },
  );

/**
 * Gives the television's launch screen Valence's mark on Valence's own dark ground, rather than the
 * blank system screen Expo's generated one shows on tvOS, whose splash image is named but never put
 * in the asset catalogue, or the grey one Android TV shows. The mark is drawn at the size and place
 * the app's own splash takes it up at, so the launch screen hands over to the app without anything
 * moving.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the launch screen dressed.
 */
const withLaunchScreen: ConfigPlugin = (config) =>
  withTheAndroidLaunchScreen(withTheIosLaunchScreen(config));

export { withLaunchScreen };
