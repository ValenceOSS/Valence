import type {
  MusicCommand,
  MusicDevice,
  MusicNowPlaying,
} from '@ValenceContracts/schemas/MusicRemote';
import type { PresenceEntry, PresenceService } from '@ValenceServer/presence/PresenceService';

type MusicDevicesOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: (profileId: string) => void;
};

type MusicDevices = {
  list: (profileId: string) => MusicDevice[];
  report: (profileId: string, clientId: string, nowPlaying: MusicNowPlaying | null) => boolean;
  command: (
    profileId: string,
    fromClientId: string,
    toClientId: string,
    command: MusicCommand,
  ) => boolean;
};

/**
 * Every open copy of Valence one person has, and what each is playing — the list "play on another
 * device" is chosen from.
 *
 * A device is a connection presence already knows about, so a closed tab or a window that lost its
 * network leaves the list on its own. What a device is playing is whatever it last said, held here
 * in memory; nothing about it needs to outlive the server. Commands go to one connection through
 * presence, and only between devices of the same profile, so nobody can pause somebody else's music
 * by guessing an identifier.
 *
 * @param options - Presence, and who to tell when a profile's devices change.
 * @returns The registry.
 */
const createMusicDevices = ({ presence, onChanged }: MusicDevicesOptions): MusicDevices => {
  const playing = new Map<string, MusicNowPlaying>();
  let known = new Map<string, string | null>();

  const owned = (profileId: string): PresenceEntry[] =>
    presence.list().filter((entry) => entry.profileId === profileId);

  presence.watch(() => {
    const now = new Map(presence.list().map((entry) => [entry.clientId, entry.profileId]));
    const touched = new Set<string>();

    for (const [clientId, profileId] of known) {
      if (!now.has(clientId)) {
        playing.delete(clientId);

        if (profileId !== null) {
          touched.add(profileId);
        }
      }
    }

    for (const [clientId, profileId] of now) {
      if (!known.has(clientId) && profileId !== null) {
        touched.add(profileId);
      }
    }

    known = now;

    for (const profileId of touched) {
      onChanged?.(profileId);
    }
  });

  return {
    list: (profileId) =>
      owned(profileId).map((entry) => ({
        clientId: entry.clientId,
        label: entry.deviceLabel,
        nowPlaying: playing.get(entry.clientId) ?? null,
      })),

    report: (profileId, clientId, nowPlaying) => {
      if (!owned(profileId).some((entry) => entry.clientId === clientId)) {
        return false;
      }

      if (nowPlaying === null) {
        playing.delete(clientId);
      } else {
        playing.set(clientId, nowPlaying);
      }

      onChanged?.(profileId);

      return true;
    },

    command: (profileId, fromClientId, toClientId, command) => {
      const devices = owned(profileId);
      const target = devices.find((entry) => entry.clientId === toClientId);

      if (target === undefined) {
        return false;
      }

      const from = devices.find((entry) => entry.clientId === fromClientId);

      return presence.tell(toClientId, {
        kind: 'music',
        command,
        fromClientId,
        fromLabel: from?.deviceLabel ?? 'Another device',
      });
    },
  };
};

export type { MusicDevices };

export { createMusicDevices };
