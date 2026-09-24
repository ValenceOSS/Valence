import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withAppDelegate, withInfoPlist } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const THE_DELEGATE = join(import.meta.dirname, '..', 'modules', 'scene', 'SceneDelegate.swift');

const THE_OLD_WAY = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

const THE_NEW_WAY = `    launchedWith = launchOptions`;

const HOLDS_THE_LAUNCH = `  var reactNativeFactory: RCTReactNativeFactory?`;

const ALSO_HOLDS_THE_LAUNCH = `  var reactNativeFactory: RCTReactNativeFactory?
  var launchedWith: [UIApplication.LaunchOptionsKey: Any]?`;

/**
 * Teaches the generated application the scene lifecycle, which iOS 27 will not run without.
 *
 * React Native makes its window as an application launches, which is how it was done before scenes
 * existed and is now a fatal offence: iOS 27 looks for a `UIWindowSceneDelegate`, does not find
 * one, and kills the process before any JavaScript runs. The window is moved into a scene delegate
 * and the manifest is declared so the system knows to ask for one.
 *
 * The delegate itself is Swift on disk rather than Swift in a string, because it is real code that
 * deserves to be read and edited as such. This only carries it into a project that is regenerated
 * every time anybody runs a prebuild.
 *
 * Every edit it makes is checked before it is made. An Expo release that writes a different
 * application delegate should stop a build rather than quietly produce one that cannot start.
 *
 * @param config - The project being generated.
 * @returns The same project, with a scene.
 */
const withTheSceneLifecycle: ConfigPlugin = (config) => {
  const withManifest = withInfoPlist(config, (asked) => {
    asked.modResults['UIApplicationSceneManifest'] = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };

    return asked;
  });

  return withAppDelegate(withManifest, (asked) => {
    const { contents } = asked.modResults;

    if (!contents.includes(THE_OLD_WAY)) {
      throw new Error(
        'Expo no longer writes the application delegate this expected, so the scene lifecycle was not adopted and this build would not start on iOS 27.',
      );
    }

    asked.modResults.contents = `${contents
      .replace(THE_OLD_WAY, THE_NEW_WAY)
      .replace(HOLDS_THE_LAUNCH, ALSO_HOLDS_THE_LAUNCH)}\n${readFileSync(THE_DELEGATE, 'utf8')}`;

    return asked;
  });
};

export { withTheSceneLifecycle };
