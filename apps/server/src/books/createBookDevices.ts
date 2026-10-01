import { createDeviceRegistry } from '@ValenceServer/devices/createDeviceRegistry';
import { createPlayTracker } from '@ValenceServer/devices/createPlayTracker';
import type { BookCommand, NowListening, NowReading } from '@ValenceContracts/schemas/BookRemote';
import type { DeviceOwner } from '@ValenceServer/devices/createDeviceRegistry';
import type { PlayWatchers } from '@ValenceServer/devices/createPlayTracker';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';

type BookDevicesOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: () => void;
  plays?: PlayWatchers<NowListening> & { now: () => number };
};

type BookDevices = {
  reportListening: (
    owner: DeviceOwner,
    clientId: string,
    nowListening: NowListening | null,
  ) => boolean;
  reportReading: (owner: DeviceOwner, clientId: string, nowReading: NowReading | null) => boolean;
  listeningOn: (clientId: string) => NowListening | null;
  readingOn: (clientId: string) => NowReading | null;
  order: (clientId: string, command: BookCommand) => boolean;
};

/**
 * What each open copy of Valence says it is doing with a book: listening to one, which is a play
 * like a song's that starts and stops, or reading one, which is only somewhere somebody is. Both
 * are held in the shared device registry, so a device that goes away takes what it said with it,
 * and an audiobook can be paused or stopped from elsewhere the way music can.
 *
 * @param options - Presence, who to tell when what anybody is doing with a book changes, and who
 *   to tell as each audiobook starts and stops playing.
 * @returns The devices.
 */
const createBookDevices = ({ presence, onChanged, plays }: BookDevicesOptions): BookDevices => {
  const tracker =
    plays === undefined
      ? null
      : createPlayTracker<NowListening>({
          ...plays,
          read: (nowListening) => ({
            itemId: nowListening.bookId,
            positionSeconds: nowListening.positionSeconds,
            durationSeconds: nowListening.durationSeconds,
            isPlaying: nowListening.isPlaying,
          }),
        });
  const changed = onChanged === undefined ? {} : { onChanged: () => onChanged() };
  const listening = createDeviceRegistry<NowListening>({
    presence,
    ...changed,
    ...(tracker === null ? {} : { onReport: tracker.report }),
  });
  const reading = createDeviceRegistry<NowReading>({ presence, ...changed });

  return {
    reportListening: listening.report,
    reportReading: reading.report,
    listeningOn: listening.reportOf,
    readingOn: reading.reportOf,
    order: (clientId, command) =>
      listening.reportOf(clientId) !== null && presence.tell(clientId, { kind: 'book', command }),
  };
};

export type { BookDevices };

export { createBookDevices };
