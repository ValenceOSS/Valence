import { AndroidConfig, withAndroidManifest } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

/**
 * Lets the Android app reach a server over plain HTTP, as the Apple side's `NSAllowsArbitraryLoads`
 * does: a Valence server at home is more often `http://` on the local network than behind a
 * certificate, and a release build of Android refuses plain HTTP unless the manifest says otherwise.
 *
 * @param config - The app's config.
 * @returns The config, with the manifest saying so.
 */
const withPlainHttpToServers: ConfigPlugin = (config) =>
  withAndroidManifest(config, (asked) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(asked.modResults);

    application.$['android:usesCleartextTraffic'] = 'true';

    return asked;
  });

export { withPlainHttpToServers };
