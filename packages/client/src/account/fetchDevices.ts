import { readFromServer } from '@ValenceClient/query/readFromServer';
import { ReadDeviceListSchema } from '@ValenceContracts/schemas/SignedInDevice';
import type { ReadDevice } from '@ValenceContracts/schemas/SignedInDevice';

type Device = ReadDevice;

/**
 * Everywhere this account is signed in, so somebody can see a session they do not recognise and end
 * it. Includes this one, marked as this one, since a list that quietly omitted it would look wrong
 * to anybody counting.
 */
const fetchDevices = async (): Promise<Device[]> => {
  return (await readFromServer('/api/account/devices', ReadDeviceListSchema)).devices;
};

/**
 * Signs one device out, ending its session, for the account page where somebody reviews where they
 * are signed in.
 *
 * @param deviceId - The session to end.
 */
const endDevice = async (deviceId: string): Promise<boolean> => {
  const response = await fetch(`/api/account/devices/${deviceId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Ends every session but this one, which is what somebody does after losing a device or suspecting
 * their password. Deliberately keeps the session it is called from, so nobody locks themselves out
 * of the page they are securing their account on.
 */
const endOtherDevices = async (): Promise<boolean> => {
  const response = await fetch('/api/account/devices/end-others', {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

/**
 * Gives one of this account's devices a name of its owner's choosing, or gives it back the name it
 * has of its own.
 *
 * @param deviceId - The device, by the id the list gave it.
 * @param name - What to call it, or nothing to go back to its own name.
 * @returns Whether it was renamed.
 */
const renameDevice = async (deviceId: string, name: string | null): Promise<boolean> => {
  const response = await fetch(`/api/account/devices/${deviceId}/name`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export type { Device };

export { fetchDevices, endDevice, endOtherDevices, renameDevice };
