import { theFakePlayer as mockPlayer } from '@ValenceMobile/testing/theFakePlayer';
import type { FakePlayer } from '@ValenceMobile/testing/theFakePlayer';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import {
  createContext as mockCreateContext,
  createElement as mockCreateElement,
  useEffect as mockUseEffect,
  useState as mockUseState,
} from 'react';
import type { ReactNode } from 'react';
import {
  Image as mockNativeImage,
  Pressable as mockPressable,
  View as mockView,
} from 'react-native';
import type { ImageStyle, StyleProp, ViewProps } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-safe-area-context', () => {
  const room = { bottom: 34, left: 0, right: 0, top: 59 };

  return {
    SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
    SafeAreaInsetsContext: mockCreateContext(room),
    useSafeAreaInsets: () => room,
    useSafeAreaFrame: () => ({ height: 852, width: 393, x: 0, y: 0 }),
    initialWindowMetrics: { frame: { height: 852, width: 393, x: 0, y: 0 }, insets: room },
  };
});

jest.mock('expo-device', () => ({
  DeviceType: { UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
  deviceType: 1,
  deviceName: "Dan's iPhone",
  modelName: 'iPhone',
  isDevice: true,
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(() => Promise.resolve('')),
  getRandomBytes: jest.fn((count: number) => new Uint8Array(count)),
  getRandomValues: jest.fn(<T>(array: T) => array),
  randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted', UNDETERMINED: 'undetermined' },
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ type: 'ios', data: 'a'.repeat(64) })),
}));

jest.mock('expo-application', () => ({
  getIosPushNotificationServiceEnvironmentAsync: jest.fn(() => Promise.resolve('development')),
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(() => Promise.resolve()),
  OrientationLock: { DEFAULT: 0, ALL: 1, PORTRAIT_UP: 3, LANDSCAPE: 5, LANDSCAPE_LEFT: 6 },
}));

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: (name: string) =>
    name === 'ValenceMusic'
      ? {
          load: jest.fn(),
          play: jest.fn(),
          pause: jest.fn(),
          seek: jest.fn(),
          setRate: jest.fn(),
          setVolume: jest.fn(),
          setMuted: jest.fn(),
          describe: jest.fn(),
          stop: jest.fn(),
          addListener: () => ({ remove: () => undefined }),
        }
      : null,
  useEventListener: (
    player: { addListener: (of: string, told: () => void) => { remove: () => void } },
    of: string,
    told: () => void,
  ) => {
    mockUseEffect(() => {
      const listening = player.addListener(of, told);

      return () => {
        listening.remove();
      };
    });
  },
}));

jest.mock('@ValenceMobile/platform/theCookiesThisPhoneHolds', () => ({
  theCookiesThisPhoneHolds: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children, style }: ViewProps & { children?: ReactNode }) =>
    mockCreateElement(mockView, { style }, children),
}));

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children, style }: ViewProps & { children?: ReactNode }) =>
    mockCreateElement(mockView, { style, testID: 'skia-canvas' }, children),
  ColorMatrix: ({ matrix }: { matrix: number[] }) =>
    mockCreateElement(mockView, {
      testID: 'skia-colour-matrix',
      accessibilityHint: matrix.join(','),
    }),
  Image: ({ children }: { children?: ReactNode }) =>
    mockCreateElement(mockView, { testID: 'skia-image' }, children),
  LinearGradient: () => null,
  RoundedRect: ({ children }: { children?: ReactNode }) =>
    mockCreateElement(mockView, { testID: 'skia-rounded-rect' }, children),
  Circle: ({ children }: { children?: ReactNode }) =>
    mockCreateElement(mockView, { testID: 'skia-circle' }, children),
  SweepGradient: () => null,
  vec: (x = 0, y = 0) => ({ x, y }),
  Rect: ({ color, opacity, blendMode }: { color: string; opacity: number; blendMode: string }) =>
    mockCreateElement(mockView, {
      testID: 'skia-layer',
      style: { backgroundColor: color, opacity },
      accessibilityHint: blendMode,
    }),
  Skia: {
    Data: {
      fromBytes: () => ({}),
      fromURI: () => Promise.resolve({}),
    },
    Image: {
      MakeImageFromEncoded: () => ({ width: () => 1200, height: () => 800 }),
    },
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: (props: ViewProps) => mockCreateElement(mockView, props),
}));

jest.mock('expo-glass-tabs', () => ({
  TabBarMinimizeProvider: ({ children }: { children?: ReactNode }) => children,
  GlassTabBar: ({ children, onLayout }: ViewProps & { children?: ReactNode }) =>
    mockCreateElement(mockView, { onLayout }, children),
  GlassTabButton: (props: {
    item: { label: string; renderIcon?: (props: { tint: string; size: number }) => ReactNode };
    isFocused?: boolean;
    onPress?: () => void;
  }) =>
    mockCreateElement(
      mockPressable,
      {
        accessibilityRole: 'button',
        accessibilityLabel: props.item.label,
        accessibilityState: { selected: props.isFocused === true },
        onPress: props.onPress,
      },
      props.item.renderIcon?.({ tint: '#000000', size: 21 }),
    ),
}));

jest.mock('expo-glass-tabs/build/minimize-context', () => ({
  useMinimizeState: () => ({}),
  setMinimized: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-image', () => ({
  Image: Object.assign(
    (props: {
      source: { uri: string; headers?: Record<string, string> };
      style?: StyleProp<ImageStyle>;
      accessible?: boolean;
      accessibilityLabel?: string;
      onError?: () => void;
      onLoad?: (event: { source: { width: number; height: number } }) => void;
    }) =>
      mockCreateElement(mockNativeImage, {
        source: props.source,
        style: props.style,
        accessible: props.accessible,
        accessibilityLabel: props.accessibilityLabel,
        onError: props.onError,
        onLoad: (event?: { nativeEvent?: { source?: { width: number; height: number } } }) => {
          props.onLoad?.({ source: event?.nativeEvent?.source ?? { width: 0, height: 0 } });
        },
      }),
    {
      clearMemoryCache: jest.fn(() => Promise.resolve(true)),
      clearDiskCache: jest.fn(() => Promise.resolve(true)),
    },
  ),
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: (
    source: {
      uri: string;
      headers?: Record<string, string>;
      metadata?: { title?: string; artwork?: string };
    } | null,
    ready?: (player: FakePlayer) => void,
  ) => {
    mockUseState(() => {
      ready?.(mockPlayer);

      return true;
    });

    mockUseEffect(() => {
      if (source === null) {
        return;
      }

      mockPlayer.source = source.uri;
      mockPlayer.sentWith = source.headers ?? null;
      mockPlayer.describedAs = source.metadata ?? null;
      void Promise.resolve().then(() => {
        mockPlayer.say('sourceLoad', { loaded: true });
      });
    }, [source?.uri]);

    return mockPlayer;
  },
  VideoView: ({
    startsPictureInPictureAutomatically,
    onPictureInPictureStart,
    onPictureInPictureStop,
  }: {
    startsPictureInPictureAutomatically?: boolean;
    onPictureInPictureStart?: () => void;
    onPictureInPictureStop?: () => void;
  }) => {
    mockPlayer.floatsOnLeaving = startsPictureInPictureAutomatically === true;
    mockPlayer.popOut = onPictureInPictureStart ?? (() => undefined);
    mockPlayer.popBackIn = onPictureInPictureStop ?? (() => undefined);

    return null;
  },
}));

jest.mock('react-native-google-cast', () => ({
  __esModule: true,
  default: {
    showCastDialog: jest.fn(() => Promise.resolve(true)),
    getSessionManager: jest.fn(() => ({
      onSessionStarted: jest.fn(() => ({ remove: jest.fn() })),
      onSessionEnded: jest.fn(() => ({ remove: jest.fn() })),
      onSessionStartFailed: jest.fn(() => ({ remove: jest.fn() })),
      getCurrentCastSession: jest.fn(() => Promise.resolve(null)),
      endCurrentSession: jest.fn(() => Promise.resolve()),
    })),
  },
  CastState: {
    NO_DEVICES_AVAILABLE: 'noDevicesAvailable',
    NOT_CONNECTED: 'notConnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
  },
  MediaPlayerIdleReason: {
    CANCELLED: 'cancelled',
    ERROR: 'error',
    FINISHED: 'finished',
    INTERRUPTED: 'interrupted',
  },
  MediaPlayerState: {
    BUFFERING: 'buffering',
    IDLE: 'idle',
    LOADING: 'loading',
    PAUSED: 'paused',
    PLAYING: 'playing',
  },
  useCastState: jest.fn(() => 'notConnected'),
  useCastDevice: jest.fn(() => null),
  useRemoteMediaClient: jest.fn(() => null),
  useMediaStatus: jest.fn(() => null),
  useStreamPosition: jest.fn(() => null),
}));
