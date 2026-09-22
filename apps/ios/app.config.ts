import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Valence',
  slug: 'valence',
  scheme: 'valence',
  version: '0.0.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'app.valence.phone',
    icon: '../../design/valence-icon.icon',
    supportsTablet: false,
    infoPlist: {
      UIBackgroundModes: ['audio'],
      NSLocalNetworkUsageDescription:
        'Valence needs this to reach a server on your own network, which is where a self-hosted one usually is.',
    },
  },
  plugins: [
    ['expo-build-properties', { ios: { deploymentTarget: '18.0' } }],
    './plugins/withTheSceneLifecycle',
  ],
};

export default config;
