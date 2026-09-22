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
    supportsTablet: false,
    infoPlist: {
      UIBackgroundModes: ['audio'],
    },
  },
  plugins: [['expo-build-properties', { ios: { deploymentTarget: '18.0' } }]],
};

export default config;
