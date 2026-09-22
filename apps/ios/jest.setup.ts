import { theFakePlayer as mockPlayer } from '@ValencePhone/testing/theFakePlayer';
import type { FakePlayer } from '@ValencePhone/testing/theFakePlayer';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import type { ReactNode } from 'react';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-safe-area-context', () => {
  const room = { bottom: 34, left: 0, right: 0, top: 59 };

  return {
    SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
    SafeAreaView: ({ children }: { children: ReactNode }) => children,
    useSafeAreaInsets: () => room,
    useSafeAreaFrame: () => ({ height: 852, width: 393, x: 0, y: 0 }),
  };
});

jest.mock('expo-device', () => ({ deviceName: "Dan's iPhone", modelName: 'iPhone' }));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(() => Promise.resolve()),
  OrientationLock: { ALL: 1, PORTRAIT_UP: 3, LANDSCAPE: 5, LANDSCAPE_LEFT: 6 },
}));

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => null,
}));

jest.mock('@react-native-cookies/cookies', () => ({
  get: jest.fn(() => Promise.resolve({})),
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: (
    source: { uri: string; headers?: Record<string, string> } | null,
    ready?: (player: FakePlayer) => void,
  ) => {
    if (source !== null && source.uri !== mockPlayer.source) {
      mockPlayer.source = source.uri;
      mockPlayer.sentWith = source.headers ?? null;
      ready?.(mockPlayer);
    }

    return mockPlayer;
  },
  VideoView: () => null,
}));
