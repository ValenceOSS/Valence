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
        'Valence needs this to find and reach a server on your own network, which is where a self-hosted one usually is.',
      NSBonjourServices: ['_valence._tcp'],
    },
  },
  plugins: [
    ['expo-build-properties', { ios: { deploymentTarget: '18.0' } }],
    './plugins/withTheSceneLifecycle',
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Gilroy-Light.ttf',
          './assets/fonts/Gilroy-Regular.ttf',
          './assets/fonts/Gilroy-Medium.ttf',
          './assets/fonts/Gilroy-Semibold.ttf',
          './assets/fonts/Gilroy-Bold.ttf',
          './assets/fonts/Gilroy-Extrabold.ttf',
          './assets/fonts/Manrope-Regular.ttf',
          './assets/fonts/Manrope-Medium.ttf',
          './assets/fonts/Manrope-SemiBold.ttf',
          './assets/fonts/Manrope-Bold.ttf',
          './assets/fonts/Manrope-ExtraBold.ttf',
        ],
      },
    ],
  ],
};

export default config;
