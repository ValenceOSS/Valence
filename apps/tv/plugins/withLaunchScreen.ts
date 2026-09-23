import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDangerousMod } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const MARKS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'launch');

const SYSTEM_GROUND = '<color key="backgroundColor" systemColor="systemBackgroundColor"/>';

const VALENCE_GROUND =
  '<color key="backgroundColor" red="0.0549" green="0.0549" blue="0.0549" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>';

const IMAGE_SET = {
  images: [
    { idiom: 'tv', filename: 'launch-mark.png', scale: '1x' },
    { idiom: 'tv', filename: 'launch-mark@2x.png', scale: '2x' },
    { idiom: 'universal', filename: 'launch-mark@2x.png', scale: '2x' },
  ],
  info: { author: 'valence', version: 1 },
};

/**
 * Gives the television's launch screen Valence's mark on Valence's own dark ground, rather than the
 * blank system screen Expo's generated one shows on tvOS, whose splash image is named but never put
 * in the asset catalogue. The mark is drawn at the size and place the app's own splash takes it up
 * at, so the launch screen hands over to the app without anything moving.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the launch screen dressed.
 */
const withLaunchScreen: ConfigPlugin = (config) =>
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

export { withLaunchScreen };
