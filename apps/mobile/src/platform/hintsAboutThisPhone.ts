import { Platform } from 'react-native';
import { DeviceType, deviceName, deviceType, isDevice, modelName } from 'expo-device';
import type { DeviceHints } from '@ValenceContracts/schemas/DeviceHints';

type Phone = {
  system: typeof Platform.OS;
  isPad: boolean;
  isDevice: boolean;
  isTablet: boolean;
  name: string | null;
  model: string | null;
};

/**
 * What the phone itself says about it: the name it reports and the model it is.
 *
 * @returns The phone, as its system describes it.
 */
const thisPhone = (): Phone => ({
  system: Platform.OS,
  isPad: Platform.OS === 'ios' && Platform.isPad,
  isDevice,
  isTablet: deviceType === DeviceType.TABLET,
  name: deviceName,
  model: modelName,
});

/**
 * What this phone tells the server about itself: that it is Valence's own app, which system it runs,
 * whether it is a phone or a tablet, its model — an "iPhone 17 Pro Max", a "Pixel 9" — and the name
 * its owner gave it where the system will say. An iPhone answers "iPhone" for its name to every app
 * that has not been allowed to know more, which the server takes for no name, and a simulator or an
 * emulator has a model that is no model at all.
 *
 * @param phone - The phone, as its system describes it.
 * @returns What to tell the server.
 */
const hintsAboutThisPhone = (phone: Phone = thisPhone()): DeviceHints => {
  const system = phone.system === 'android' ? 'android' : phone.isPad ? 'ipados' : 'ios';

  return {
    app: 'phone',
    system,
    form: phone.isPad || phone.isTablet ? 'tablet' : 'phone',
    ...(phone.isDevice && phone.model !== null ? { model: phone.model } : {}),
    ...(phone.isDevice && phone.name !== null ? { name: phone.name } : {}),
  };
};

export { hintsAboutThisPhone };
