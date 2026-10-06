import { Platform } from 'react-native';
import { deviceName, isDevice, modelName } from 'expo-device';
import { say } from '@ValenceI18n/say';

/**
 * What to call this phone in the list of sessions somebody is reading.
 *
 * What its owner named it where the phone will say — "Dan's iPhone" is what they will recognise —
 * and the model where it will not. A simulator answers neither, and is named as what it is rather
 * than left blank.
 *
 * An Android phone says it is one, as a browser says the system it runs on, since its name — a
 * Pixel, a Galaxy — does not, and that is what the sessions list draws its logo from. An emulator
 * reports a build code for a model, so it is called an emulator instead.
 *
 * @returns The device as a person would describe it.
 */
const describeThisPhone = (): string => {
  if (Platform.OS !== 'android') {
    return deviceName ?? modelName ?? 'iPhone';
  }

  const name = isDevice
    ? (deviceName ?? modelName ?? say('phone.platform.describeThisPhone.aPhone'))
    : say('phone.platform.describeThisPhone.anEmulator');

  return say('phone.platform.describeThisPhone.nameOnAndroid', { name });
};

export { describeThisPhone };
