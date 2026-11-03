import { Platform } from 'react-native';
import { keepsUpWithPreviews } from './keepsUpWithPreviews';

const mockDevice: { totalMemory: number | null } = { totalMemory: null };

jest.mock('expo-device', () => ({
  get totalMemory() {
    return mockDevice.totalMemory;
  },
}));

const GIB = 1024 ** 3;

describe('keepsUpWithPreviews', () => {
  const was = Platform.OS;

  afterEach(() => {
    Platform.OS = was;
  });

  it('plays them on an Android phone with 6 GB or more', () => {
    Platform.OS = 'android';
    mockDevice.totalMemory = 5.5 * GIB;

    expect(keepsUpWithPreviews()).toBe(true);
  });

  it('holds still on an Android phone with less', () => {
    Platform.OS = 'android';
    mockDevice.totalMemory = 3.7 * GIB;

    expect(keepsUpWithPreviews()).toBe(false);
  });

  it('plays them on an iPhone whatever its memory', () => {
    Platform.OS = 'ios';
    mockDevice.totalMemory = 3.7 * GIB;

    expect(keepsUpWithPreviews()).toBe(true);
  });

  it('plays them where the phone does not say how much memory it has', () => {
    Platform.OS = 'android';
    mockDevice.totalMemory = null;

    expect(keepsUpWithPreviews()).toBe(true);
  });
});
