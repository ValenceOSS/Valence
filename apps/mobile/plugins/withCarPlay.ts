import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withAppDelegate, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';
import type { ConfigPlugin } from 'expo/config-plugins';

const CAR_ROLE = 'CPTemplateApplicationSceneSessionRoleApplication';

const THE_DELEGATE = join(
  import.meta.dirname,
  '..',
  'modules',
  'carPlay',
  'ios',
  'app',
  'CarPlaySceneDelegate.swift',
);

/**
 * Lets the phone app appear in CarPlay as an audio app: the entitlement Apple grants for it, and a
 * CarPlay scene beside the phone's own window, and the delegate that scene is given.
 *
 * The delegate is carried into the application delegate's file rather than the CarPlay module,
 * because it starts React Native when a car opens the app first, and only the application holds
 * React Native. It is Swift on disk for the same reason the phone's own scene delegate is.
 *
 * Runs after the scene lifecycle is adopted, because that writes the manifest this adds to.
 *
 * @param config - The project being generated.
 * @returns The same project, able to show itself in a car.
 */
const withCarPlay: ConfigPlugin = (config) => {
  const withEntitlement = withEntitlementsPlist(config, (asked) => {
    asked.modResults['com.apple.developer.carplay-audio'] = true;

    return asked;
  });

  const withDelegate = withAppDelegate(withEntitlement, (asked) => {
    asked.modResults.contents = `${asked.modResults.contents}\n${readFileSync(THE_DELEGATE, 'utf8')}`;

    return asked;
  });

  return withInfoPlist(withDelegate, (asked) => {
    const manifest = asked.modResults['UIApplicationSceneManifest'];

    if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
      throw new Error('The scene manifest was not written before CarPlay was added to it.');
    }

    const configurations = Reflect.get(manifest, 'UISceneConfigurations');

    if (
      typeof configurations !== 'object' ||
      configurations === null ||
      Array.isArray(configurations)
    ) {
      throw new Error('The scene manifest has no scene configurations for CarPlay to join.');
    }

    Reflect.set(configurations, CAR_ROLE, [
      {
        UISceneClassName: 'CPTemplateApplicationScene',
        UISceneConfigurationName: 'CarPlay',
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).CarPlaySceneDelegate',
      },
    ]);

    return asked;
  });
};

export { withCarPlay };
