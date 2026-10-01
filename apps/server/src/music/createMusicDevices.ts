import { createDeviceRegistry } from '@ValenceServer/devices/createDeviceRegistry';
import { createPlayTracker } from '@ValenceServer/devices/createPlayTracker';
import type {
  MusicCommand,
  MusicDevice,
  MusicNowPlaying,
} from '@ValenceContracts/schemas/MusicRemote';
import type { DeviceOwner } from '@ValenceServer/devices/createDeviceRegistry';
import type { PlayWatchers } from '@ValenceServer/devices/createPlayTracker';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';
import { say } from '@ValenceI18n/say';

type Listener = DeviceOwner;

type MusicDevicesOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: (accountId: string) => void;
  plays?: PlayWatchers<MusicNowPlaying> & { now: () => number };
};

type MusicDevices = {
  list: (listener: Listener) => MusicDevice[];
  report: (listener: Listener, clientId: string, nowPlaying: MusicNowPlaying | null) => boolean;
  command: (
    listener: Listener,
    fromClientId: string,
    toClientId: string,
    command: MusicCommand,
  ) => boolean;
  playingOn: (clientId: string) => MusicNowPlaying | null;
  order: (clientId: string, command: MusicCommand) => boolean;
};

/**
 * Every open copy of Valence one person has, and what each is playing — the list "play on another
 * device" is chosen from for music. Which devices are whose, and what each last said, is the
 * shared device registry's; this adds what a song's report and a music command are.
 *
 * @param options - Presence, who to tell when a profile's devices change, and who to tell as each
 *   song starts and stops playing.
 * @returns The registry.
 */
const createMusicDevices = ({ presence, onChanged, plays }: MusicDevicesOptions): MusicDevices => {
  const tracker =
    plays === undefined
      ? null
      : createPlayTracker<MusicNowPlaying>({
          ...plays,
          read: (nowPlaying) => ({
            itemId: nowPlaying.trackId,
            positionSeconds: nowPlaying.positionSeconds,
            durationSeconds: nowPlaying.durationSeconds,
            isPlaying: nowPlaying.isPlaying,
          }),
        });
  const devices = createDeviceRegistry<MusicNowPlaying>({
    presence,
    ...(onChanged === undefined ? {} : { onChanged }),
    ...(tracker === null ? {} : { onReport: tracker.report }),
  });

  return {
    list: (listener) =>
      devices.owned(listener).map((entry) => ({
        clientId: entry.clientId,
        label: entry.deviceLabel,
        nowPlaying: devices.reportOf(entry.clientId),
      })),

    report: devices.report,

    playingOn: devices.reportOf,

    order: (clientId, command) =>
      devices.reportOf(clientId) !== null &&
      presence.tell(clientId, {
        kind: 'music',
        command,
        fromClientId: 'server',
        fromLabel: say('server.music.musicDevices.anAdministrator'),
      }),

    command: (listener, fromClientId, toClientId, command) =>
      devices.tell(listener, fromClientId, toClientId, (fromLabel) => ({
        kind: 'music',
        command,
        fromClientId,
        fromLabel,
      })),
  };
};

export type { Listener, MusicDevices };

export { createMusicDevices };
