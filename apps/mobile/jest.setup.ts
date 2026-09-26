import { theFakePlayer as mockPlayer } from '@ValenceMobile/testing/theFakePlayer';
import type { FakePlayer } from '@ValenceMobile/testing/theFakePlayer';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import {
  createContext as mockCreateContext,
  useEffect as mockUseEffect,
  useState as mockUseState,
} from 'react';
import type { ReactNode } from 'react';

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

jest.mock('expo-device', () => ({ deviceName: "Dan's iPhone", modelName: 'iPhone' }));

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

jest.mock('@react-native-cookies/cookies', () => ({
  get: jest.fn(() => Promise.resolve({})),
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
  }: {
    startsPictureInPictureAutomatically?: boolean;
  }) => {
    mockPlayer.floatsOnLeaving = startsPictureInPictureAutomatically === true;

    return null;
  },
}));
