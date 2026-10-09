import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.deviceNotices';

/**
 * Whether this device puts notices up on its own screen, which it does only once somebody has
 * turned that on: several arriving together came up as several notices in a row.
 *
 * @returns Whether notices are on here.
 */
const areDeviceNoticesOn = (): boolean => platformInUse().store.read(STORAGE_KEY) === 'on';

/**
 * Turns this device's own notices on or off.
 *
 * @param isOn - Whether they are now on.
 */
const chooseDeviceNotices = (isOn: boolean): void => {
  const { store } = platformInUse();

  if (isOn) {
    store.write(STORAGE_KEY, 'on');
  } else {
    store.forget(STORAGE_KEY);
  }
};

export { areDeviceNoticesOn, chooseDeviceNotices };
