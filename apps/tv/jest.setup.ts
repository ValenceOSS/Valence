import { aFakeVideoPlayer as mockAFakeVideoPlayer } from '@ValenceTv/testing/aFakeVideoPlayer';
import { createElement as mockCreateElement } from 'react';
import { View as mockView } from 'react-native';
import type { ReactNode } from 'react';

const mockPalette = {
  'color-surface': '#0d0d0d',
  'color-surface-raised': '#1a1a1a',
  'color-border': '#2a2a2a',
  'color-text': '#fafafa',
  'color-text-muted': '#a0a0a0',
  'color-accent': '#3a8ee8',
  'color-accent-hover': '#5aa0ee',
  'color-accent-contrast': '#ffffff',
  'color-on-white': '#000000',
  'color-danger': '#e8503a',
  'color-success': '#3ac47d',
  'color-scrim': '#000000',
  'color-on-scrim': '#ffffff',
  'surface-line': '#333333',
  'surface-hover': '#222222',
  'surface-active': '#2c2c2c',
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { palette: mockPalette } }, deviceName: 'Living Room' },
}));

jest.mock('expo-secure-store', () => {
  const kept = new Map<string, string>();

  return {
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => {
      kept.set(key, value);
    },
    deleteItemAsync: (key: string) => {
      kept.delete(key);

      return Promise.resolve();
    },
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => undefined,
    fetch: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
  },
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: () => mockAFakeVideoPlayer(),
  VideoView: () => null,
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
    clearLockScreenControls: jest.fn(),
    setAudioSamplingEnabled: jest.fn(),
    addListener: () => ({ remove: () => undefined }),
  }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => null,
  requireNativeView:
    () =>
    ({ children, style }: { children?: ReactNode; style?: object }) =>
      mockCreateElement(mockView, { style }, children),
}));
