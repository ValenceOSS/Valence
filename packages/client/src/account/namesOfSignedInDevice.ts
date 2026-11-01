import type { SignedInDevice } from '@ValenceContracts/schemas/SignedInDevice';
import { sayAgain } from '@ValenceI18n/sayAgain';

/**
 * What a signed-in device is called and what it reaches Valence through, in this client's language,
 * falling back to the one name an older server gave it for both.
 *
 * @param device - The device.
 * @returns The device's name, and its client's where it is known.
 */
const namesOfSignedInDevice = (
  device: SignedInDevice,
): { device: string; client: string | null } => ({
  device: sayAgain(device.device ?? device.name),
  client: device.client === null ? null : sayAgain(device.client),
});

export { namesOfSignedInDevice };
