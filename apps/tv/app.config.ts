import type { ExpoConfig } from 'expo/config';
import { withTheSceneLifecycle } from './plugins/withTheSceneLifecycle.ts';
import { readValencePalette } from './plugins/readValencePalette.ts';
import { readTheBuild } from './plugins/readTheBuild.ts';
import { withTopShelf } from './plugins/withTopShelf.ts';
import { withLaunchScreen } from './plugins/withLaunchScreen.ts';

const build = readTheBuild();

const config: ExpoConfig = {
  name: 'Valence',
  slug: 'valence-tv',
  scheme: 'valence',
  version: build.version === 'unknown' ? '0.0.0' : build.version,
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
  extra: { palette: readValencePalette(), build },
  plugins: [
    [
      '@react-native-tvos/config-tv',
      {
        isTV: true,
        appleTVImages: {
          icon: './assets/tv-icons/icon.png',
          iconSmall: './assets/tv-icons/iconSmall.png',
          iconSmall2x: './assets/tv-icons/iconSmall2x.png',
          topShelf: './assets/tv-icons/topShelf.png',
          topShelf2x: './assets/tv-icons/topShelf2x.png',
          topShelfWide: './assets/tv-icons/topShelfWide.png',
          topShelfWide2x: './assets/tv-icons/topShelfWide2x.png',
        },
      },
    ],
    'expo-secure-store',
    'expo-video',
  ],
};

export default withLaunchScreen(withTopShelf(withTheSceneLifecycle(config)));
