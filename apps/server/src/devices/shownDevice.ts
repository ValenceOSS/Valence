import type { SignedInDevice } from '@ValenceContracts/schemas/SignedInDevice';
import type { HeldDevice } from '@ValenceServer/devices/groupIntoDevices';

/**
 * A device as the devices list shows it, without the server's own handles on the sign-ins behind it.
 *
 * @param device - The device as the server holds it.
 * @returns The device as it is sent.
 */
const shownDevice = ({
  key: _key,
  sessionIds: _sessionIds,
  ...shown
}: HeldDevice): SignedInDevice => shown;

export { shownDevice };
