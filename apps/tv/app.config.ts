import type { ExpoConfig } from 'expo/config';
import { withTheSceneLifecycle } from './plugins/withTheSceneLifecycle.ts';
import { readValencePalette } from './plugins/readValencePalette.ts';

const config: ExpoConfig = {
  name: 'Valence',
  slug: 'valence-tv',
  scheme: 'valence',
  version: '0.0.0',
  userInterfaceStyle: 'dark',
  ios: {
    bundleIdentifier: 'app.valence.tv',
    infoPlist: {
      NSLocalNetworkUsageDescription:
        'Valence looks on your network for the Valence servers there, so you can pick yours instead of typing its address.',
      NSBonjourServices: ['_valence._tcp'],
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  extra: { palette: readValencePalette() },
  plugins: [
    ['@react-native-tvos/config-tv', { isTV: true }],
    'expo-secure-store',
    'expo-video',
  ],
};

export default withTheSceneLifecycle(config);
