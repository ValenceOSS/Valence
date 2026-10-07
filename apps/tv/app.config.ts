import type { ExpoConfig } from 'expo/config';
import { withTheSceneLifecycle } from './plugins/withTheSceneLifecycle.ts';
import { readValencePalette } from './plugins/readValencePalette.ts';
import { readTheBuild } from './plugins/readTheBuild.ts';
import { withTopShelf } from './plugins/withTopShelf.ts';
import { withLaunchScreen } from './plugins/withLaunchScreen.ts';
import { withPlainHttpToServers } from './plugins/withPlainHttpToServers.ts';
import { withTelevisionSizedScreen } from './plugins/withTelevisionSizedScreen.ts';
import { withoutTheSystemFocusHighlight } from './plugins/withoutTheSystemFocusHighlight.ts';
import { withoutRequiringWifi } from './plugins/withoutRequiringWifi.ts';

const build = readTheBuild();

const config: ExpoConfig = {
  name: 'Valence',
  slug: 'valence-tv',
  owner: 'valence-oss',
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
  android: {
    package: 'app.valence.tv',
    allowBackup: false,
  },
  extra: {
    palette: readValencePalette(),
    build,
    eas: {
      projectId: '9221bbf1-0a41-470f-86a9-e25af77f0bda',
      build: {
        experimental: {
          ios: {
            appExtensions: [
              {
                targetName: 'TopShelf',
                bundleIdentifier: 'app.valence.tv.topshelf',
                entitlements: { 'com.apple.security.application-groups': ['group.app.valence.tv'] },
              },
            ],
          },
        },
      },
    },
  },
  plugins: [
    [
      '@react-native-tvos/config-tv',
      {
        isTV: true,
        androidTVRequired: false,
        androidTVBanner: './assets/android-tv/banner.png',
        androidTVIcon: './assets/android-tv/icon.png',
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
    ['expo-audio', { enableBackgroundPlayback: true, recordAudioAndroid: false }],
  ],
};

export default withoutRequiringWifi(
  withoutTheSystemFocusHighlight(
    withTelevisionSizedScreen(
      withPlainHttpToServers(withLaunchScreen(withTopShelf(withTheSceneLifecycle(config)))),
    ),
  ),
);
