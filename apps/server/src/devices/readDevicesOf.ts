import type { DeviceNotes, HeldSession } from '@ValenceServer/devices/DeviceNotes';
import { groupIntoDevices } from '@ValenceServer/devices/groupIntoDevices';
import type { HeldDevice } from '@ValenceServer/devices/groupIntoDevices';

type DeviceReading = {
  userId: string;
  currentSessionId: string | null;
  notes: DeviceNotes | undefined;
  heldWithoutNotes: () => Promise<HeldSession[]>;
  presence: { list: () => readonly { sessionId: string | null }[] };
  now: Date;
};

/**
 * The devices an account is signed in on, with which of them are in use now: read from the server's
 * notes on each sign-in where it keeps them, and from the sign-ins alone where it does not, so that a
 * device that never said what it is is still listed as what its user agent says.
 *
 * @param reading - Whose devices, the one asking from, and where to read them.
 * @returns The devices.
 */
const readDevicesOf = async ({
  userId,
  currentSessionId,
  notes,
  heldWithoutNotes,
  presence,
  now,
}: DeviceReading): Promise<HeldDevice[]> => {
  const [held, renamed] = await Promise.all([
    notes === undefined ? heldWithoutNotes() : notes.heldBy(userId, now),
    notes === undefined ? new Map<string, string>() : notes.renamedBy(userId),
  ]);

  return groupIntoDevices({
    held,
    renamed,
    currentSessionId,
    liveSessionIds: new Set(
      presence.list().flatMap((entry) => (entry.sessionId === null ? [] : [entry.sessionId])),
    ),
    now,
  });
};

export { readDevicesOf };
