import type { SignedInDevice } from '@ValenceContracts/schemas/SignedInDevice';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { nameTheClient } from '@ValenceCore/functions/nameTheClient';
import { nameTheDevice } from '@ValenceCore/functions/nameTheDevice';
import { saying } from '@ValenceI18n/saying';
import type { HeldSession } from '@ValenceServer/devices/DeviceNotes';

type HeldDevice = SignedInDevice & { key: string; sessionIds: string[] };

type Grouping = {
  held: readonly HeldSession[];
  renamed: ReadonlyMap<string, string>;
  currentSessionId: string | null;
  liveSessionIds: ReadonlySet<string>;
  now: Date;
};

const THIS_SIGN_IN = 'thisSignIn';

/**
 * Which device a sign-in belongs to: the one its client said it is, or the sign-in itself where it
 * never said, so that every sign-in is somewhere and can be renamed and signed out.
 *
 * @param held - The sign-in.
 * @returns The device's key.
 */
const deviceKeyOf = (held: HeldSession): string => held.deviceId ?? held.id;

/**
 * When a sign-in was last seen, or when it began where it has not been seen since.
 *
 * @param held - The sign-in.
 * @returns When.
 */
const lastSeenOf = (held: HeldSession): number => (held.lastActiveAt ?? held.createdAt).getTime();

/**
 * Turns everywhere an account is signed in into the devices it is signed in on: the sign-ins one
 * device made — a browser that signed in again, an app signed out and back in — gathered into one
 * row named after the newest of them, so somebody reads the devices they own rather than the times
 * they signed in. The device this list is read on comes first, then the ones in use now, then the
 * rest by when each was last used.
 *
 * The sign-in the list is read from is always a row of its own. Which device a sign-in is on is
 * what its client says, so another sign-in claiming the same device is shown, and can be signed
 * out, as itself rather than hidden behind "this device".
 *
 * @param grouping - The sign-ins, the names their owner gave their devices, and which are live.
 * @returns The devices.
 */
const groupIntoDevices = ({
  held,
  renamed,
  currentSessionId,
  liveSessionIds,
  now,
}: Grouping): HeldDevice[] => {
  const byDevice = new Map<string, HeldSession[]>();

  for (const one of held) {
    const group = one.id === currentSessionId ? THIS_SIGN_IN : deviceKeyOf(one);

    byDevice.set(group, [...(byDevice.get(group) ?? []), one]);
  }

  const devices = [...byDevice.values()].map((sessions): HeldDevice => {
    const newestFirst = sessions.toSorted((one, other) => lastSeenOf(other) - lastSeenOf(one));
    const current = sessions.find((one) => one.id === currentSessionId);
    const shown = current ?? newestFirst[0];

    if (shown === undefined) {
      throw new RangeError('a device was gathered from no sign-ins');
    }

    const key = deviceKeyOf(shown);

    const identity = shown.device ?? identifyDevice({ userAgent: shown.userAgent });
    const ownName = renamed.get(key) ?? null;
    const device = nameTheDevice(identity, ownName);
    const client = nameTheClient(identity);
    const isActiveNow = sessions.some((one) => liveSessionIds.has(one.id));
    const lastSeen = Math.max(...sessions.map(lastSeenOf));
    const signedInAt = Math.max(...sessions.map((one) => one.createdAt.getTime()));
    const expiresAt = Math.max(...sessions.map((one) => one.expiresAt.getTime()));

    return {
      key,
      sessionIds: sessions.map((one) => one.id),
      id: shown.id,
      name: saying('common.deviceThroughClient', { device, client }),
      device,
      client,
      identity,
      renamed: ownName,
      address: shown.ipAddress,
      signedInAt: new Date(signedInAt).toISOString(),
      lastActiveAt: new Date(isActiveNow ? now.getTime() : lastSeen).toISOString(),
      isActiveNow,
      expiresAt: new Date(expiresAt).toISOString(),
      isCurrent: current !== undefined,
    };
  });

  return devices.toSorted(
    (one, other) =>
      Number(other.isCurrent) - Number(one.isCurrent) ||
      Number(other.isActiveNow) - Number(one.isActiveNow) ||
      Date.parse(other.lastActiveAt ?? other.signedInAt) -
        Date.parse(one.lastActiveAt ?? one.signedInAt),
  );
};

export type { HeldDevice };

export { groupIntoDevices };
