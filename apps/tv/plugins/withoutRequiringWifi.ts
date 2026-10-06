import { withAndroidManifest } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const WIFI = 'android.hardware.wifi';

/**
 * Says the television app can do without Wi-Fi, so the stores still offer it to a box plugged into
 * the network by cable.
 *
 * Reading the network's state asks for Wi-Fi's, and Android takes that to mean Wi-Fi is needed,
 * which the Amazon Appstore and Google Play then hold against every television without it.
 *
 * @param config - The app's config.
 * @returns The config, with Wi-Fi marked as not needed.
 */
const withoutRequiringWifi: ConfigPlugin = (config) =>
  withAndroidManifest(config, (asked) => {
    const manifest = asked.modResults.manifest;
    const features = (manifest['uses-feature'] ?? []).filter(
      (feature) => feature.$['android:name'] !== WIFI,
    );

    manifest['uses-feature'] = [
      ...features,
      { $: { 'android:name': WIFI, 'android:required': 'false' } },
    ];

    return asked;
  });

export { withoutRequiringWifi };
