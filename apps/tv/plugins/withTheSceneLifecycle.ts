import { withAppDelegate, withInfoPlist } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const DECLARED = 'class AppDelegate: ExpoAppDelegate {';

const PROVIDING = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';

const STARTED_BY_THE_APP = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/u;

const SCENE_DELEGATE = 'EXExpoAppSceneDelegate';

/**
 * Hands the window to the scene rather than the application, which tvOS 27 requires of anything
 * built with its SDK: an app that makes its window at launch is stopped before it draws.
 *
 * Expo ships the scene delegate that does this — it makes the window from the connecting scene and
 * starts React Native in it — but the project it generates still makes the window itself. So the
 * app delegate is told to provide the factory instead of using it, and the scene is named in the
 * app's Info.plist.
 *
 * It refuses to build rather than guess where Expo's generated delegate no longer looks the way this
 * expects, since an app delegate edited wrongly still compiles and then will not launch.
 *
 * @param config - The app's Expo config.
 * @returns The config, with the scene life cycle adopted.
 */
const withTheSceneLifecycle: ConfigPlugin = (config) => {
  const delegated = withAppDelegate(config, (asked) => {
    const source = asked.modResults.contents;

    if (source.includes(PROVIDING)) {
      return asked;
    }

    if (!source.includes(DECLARED) || !STARTED_BY_THE_APP.test(source)) {
      throw new Error(
        'withTheSceneLifecycle: the generated AppDelegate no longer matches what this plugin edits. ' +
          'Look at what Expo generates now and update the plugin, or the app will not launch on tvOS 27.',
      );
    }

    asked.modResults.contents = source.replace(DECLARED, PROVIDING).replace(STARTED_BY_THE_APP, '');

    return asked;
  });

  return withInfoPlist(delegated, (asked) => {
    asked.modResults['UIApplicationSceneManifest'] = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: SCENE_DELEGATE,
          },
        ],
      },
    };

    return asked;
  });
};

export { withTheSceneLifecycle };
