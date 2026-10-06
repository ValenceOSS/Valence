import { Platform } from 'react-native';
import { describeThisPhone } from './describeThisPhone';

const device = jest.requireMock<{ deviceName: string | null; isDevice: boolean }>('expo-device');

afterEach(() => {
  Platform.OS = 'ios';
  device.deviceName = "Dan's iPhone";
  device.isDevice = true;
});

describe('describeThisPhone', () => {
  it('uses the name its owner gave it, which is what they will recognise', () => {
    expect(describeThisPhone()).toBe("Dan's iPhone");
  });

  it('says an Android phone runs Android, as a browser says its system', () => {
    Platform.OS = 'android';
    device.deviceName = 'Pixel 10 Pro';

    expect(describeThisPhone()).toBe('Pixel 10 Pro on Android');
  });

  it('calls an emulator an emulator rather than by its build code', () => {
    Platform.OS = 'android';
    device.deviceName = 'sdk_gphone16k_arm64';
    device.isDevice = false;

    expect(describeThisPhone()).toBe('Emulator on Android');
  });
});
