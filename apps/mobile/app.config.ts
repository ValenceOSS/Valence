import type { ExpoConfig } from 'expo/config';
import { withTheSceneLifecycle } from './plugins/withTheSceneLifecycle.ts';
import { withCarPlay } from './plugins/withCarPlay.ts';
import { releaseVersion } from '@valence/core/src/functions/releaseVersion.ts';

const version = releaseVersion();

const config: ExpoConfig = {
  name: 'Valence',
  slug: 'valence',
  owner: 'valence-oss',
  scheme: 'valence',
  version: version === 'unknown' ? '0.0.0' : version,
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'app.valence.ios',
    config: { usesNonExemptEncryption: false },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
    icon: '../../design/valence-icon.icon',
    supportsTablet: true,
    infoPlist: {
      CFBundleDisplayName: 'Valence',
      UIBackgroundModes: ['audio'],
      NSLocalNetworkUsageDescription:
        'Valence needs this to find and reach a server on your own network, which is where a self-hosted one usually is.',
      NSBonjourServices: ['_valence._tcp'],
      NSCameraUsageDescription:
        'Valence uses the camera to read the code a television shows, so it can be signed in without typing.',
    },
  },
  android: {
    package: 'app.valence.android',
    icon: './assets/icon/android-icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/icon/android-icon-foreground.png',
      backgroundImage: './assets/icon/android-icon-background.png',
      backgroundColor: '#0088FF',
    },
    permissions: ['ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE'],
  },
  extra: { eas: { projectId: '11620f0a-1d3a-449d-9812-2afe80b14ecc' } },
  plugins: [
    'expo-status-bar',
    ['expo-video', { supportsBackgroundPlayback: true, supportsPictureInPicture: true }],
    [
      'expo-build-properties',
      { ios: { deploymentTarget: '18.0' }, android: { usesCleartextTraffic: true } },
    ],
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
          './assets/fonts/PlayfairDisplay-Bold.ttf',
          './assets/fonts/SpaceMono-Bold.ttf',
          './assets/fonts/BebasNeue-Regular.ttf',
          './assets/fonts/Pacifico-Regular.ttf',
          './assets/fonts/Caveat-Bold.ttf',
          './assets/fonts/PressStart2P-Regular.ttf',
        ],
      },
    ],
  ],
};

export default withTheSceneLifecycle(withCarPlay(config));
