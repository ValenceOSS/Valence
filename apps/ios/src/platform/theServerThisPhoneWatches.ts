import { THE_SERVER_ADDRESS } from '@ValencePhone/platform/THE_SERVER_ADDRESS';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * Where this phone has been told its Valence is, or nothing before anybody has said.
 *
 * A phone is not served by the thing it talks to, so unlike a browser it has no origin to fall back
 * on and has to be told. Kept under the same name the desktop client keeps it under, because it is
 * the same answer to the same question.
 *
 * @param store - Where the phone keeps what belongs to the device.
 * @returns The address, or nothing.
 */
const theServerThisPhoneWatches = (store: DeviceStore): string | null =>
  store.read(THE_SERVER_ADDRESS);

export { theServerThisPhoneWatches };
