import { randomId } from '@ValenceClient/platform/randomId';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const THIS_PHONE = 'valence.clientId';

/**
 * Which client this is, made once and then kept for as long as the application is installed.
 *
 * Presence is per running client, and a phone is one client however many times it is opened —
 * unlike a browser, where a tab is the unit and a second tab is a second thing to show. So this
 * outlives the process rather than being made afresh with it, and somebody closing Valence and
 * opening it again does not appear twice in their own list of devices.
 *
 * @param store - Where the phone keeps what belongs to the device.
 * @returns The identifier for this installation.
 */
const thisPhonesId = (store: DeviceStore): string => {
  const known = store.read(THIS_PHONE);

  if (known !== null) {
    return known;
  }

  const made = randomId();

  store.write(THIS_PHONE, made);

  return made;
};

export { thisPhonesId };
