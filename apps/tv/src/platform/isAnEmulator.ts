import { Platform } from 'react-native';
import { z } from 'zod';

const AndroidSaysSchema = z.object({ Fingerprint: z.string(), Model: z.string() });

/**
 * Whether this is an Android emulator rather than a television, from what Android says the device
 * is: an emulator's build fingerprint starts `generic`, and its model `sdk_`.
 *
 * @param says - What the system says about the device, this one's own unless a test says otherwise.
 * @returns Whether it is an emulator.
 */
const isAnEmulator = (
  says: object = Platform.OS === 'android' ? Platform.constants : {},
): boolean => {
  const read = AndroidSaysSchema.safeParse(says);

  return (
    read.success &&
    (read.data.Fingerprint.startsWith('generic') ||
      read.data.Fingerprint.includes('emulator') ||
      read.data.Model.startsWith('sdk_'))
  );
};

export { isAnEmulator };
