import { CALLER_HEADER } from '@ValenceServer/web/CALLER_HEADER';
import { DEVICE_HEADER } from '@ValenceContracts/constants/DEVICE_HEADER';
import { DeviceIdSchema } from '@ValenceContracts/schemas/DeviceHints';
import { JELLYFIN_TOKEN_KINDS } from '@ValenceServer/jellyfin/JELLYFIN_TOKEN_KINDS';
import type { JellyfinOrigin } from '@ValenceServer/jellyfin/JellyfinBackend';

const PASSED_ON = ['user-agent', 'x-forwarded-for', 'x-real-ip', 'forwarded', 'cf-connecting-ip'];

const LONGEST_NAME = 60;

/**
 * The headers Valence's own endpoints read, for a request a Jellyfin app made: its session or API
 * key from the Jellyfin token, its address and user agent as it sent them, and its device's name
 * and identifier from its authorization header, so the sign-in shows up as that device.
 *
 * @param token - The Jellyfin token, which says whether it is a session or a key, or nothing.
 * @param origin - The Jellyfin app's request.
 * @returns The headers.
 */
const valenceHeadersOf = (token: string | null, origin: JellyfinOrigin): Headers => {
  const headers = new Headers();

  for (const name of PASSED_ON) {
    const value = origin.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  headers.delete(CALLER_HEADER);

  const { client, device, deviceId, version } = origin.client;
  const id = DeviceIdSchema.safeParse(deviceId?.replaceAll(/[^\w-]/gu, '').slice(0, 64));
  const name = [client, device].filter((one) => one !== null && one.trim() !== '').join(' · ');
  const hints = {
    ...(id.success ? { id: id.data } : {}),
    ...(name === '' ? {} : { name: name.slice(0, LONGEST_NAME) }),
  };

  headers.set(DEVICE_HEADER, encodeURIComponent(JSON.stringify(hints)));

  if (client !== null && !headers.has('user-agent')) {
    headers.set('user-agent', `${client}/${version ?? '0'}`);
  }

  if (token?.startsWith(JELLYFIN_TOKEN_KINDS.session) === true) {
    headers.set('authorization', `Bearer ${token.slice(JELLYFIN_TOKEN_KINDS.session.length)}`);
  }

  if (token?.startsWith(JELLYFIN_TOKEN_KINDS.key) === true) {
    headers.set('x-api-key', token.slice(JELLYFIN_TOKEN_KINDS.key.length));
  }

  return headers;
};

export { valenceHeadersOf };
