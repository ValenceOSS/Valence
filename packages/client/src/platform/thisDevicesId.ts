import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { randomId } from '@ValenceClient/platform/randomId';

const KEY = 'valence.deviceId';

/**
 * Which device this is, the same every time it asks: kept where the client keeps its preferences,
 * so that a browser signing in again, or an app signed out and back in, is still the device somebody
 * renamed rather than a new one.
 *
 * @returns The device's id.
 */
const thisDevicesId = (): string => {
  const { store } = platformInUse();
  const held = store.read(KEY);

  if (held !== null && held !== '') {
    return held;
  }

  const made = randomId();

  store.write(KEY, made);

  return made;
};

export { thisDevicesId };
