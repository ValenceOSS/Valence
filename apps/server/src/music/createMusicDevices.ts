import type {
  MusicCommand,
  MusicDevice,
  MusicNowPlaying,
} from '@ValenceContracts/schemas/MusicRemote';
import type { PresenceEntry, PresenceService } from '@ValenceServer/presence/PresenceService';

type Listener = {
  accountId: string;
  profileId: string | null;
};

type MusicDevicesOptions = {
  presence: Pick<PresenceService, 'list' | 'tell' | 'watch'>;
  onChanged?: (accountId: string) => void;
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
 * device" is chosen from.
 *
 * A device is a connection presence already knows about, so a closed tab or a window that lost its
 * network leaves the list on its own. What a device is playing is whatever it last said, held here
 * in memory; nothing about it needs to outlive the server. Commands go to one connection through
 * presence, and only between devices of the same person — the same account, and the same profile
 * wherever a device has said which it is — so nobody can pause somebody else's music by guessing an
 * identifier. A window that has not yet said which profile it is counts as the account's, since a
 * freshly opened tab is still somebody's.
 *
 * @param options - Presence, and who to tell when a profile's devices change.
 * @returns The registry.
 */
const createMusicDevices = ({ presence, onChanged }: MusicDevicesOptions): MusicDevices => {
  const playing = new Map<string, MusicNowPlaying>();
  let known = new Map<string, string | null>();

  const owned = ({ accountId, profileId }: Listener): PresenceEntry[] =>
    presence
      .list()
      .filter(
        (entry) =>
          entry.accountId === accountId &&
          (profileId === null || entry.profileId === null || entry.profileId === profileId),
      );

  presence.watch(() => {
    const now = new Map(presence.list().map((entry) => [entry.clientId, entry.accountId]));
    const touched = new Set<string>();

    for (const [clientId, accountId] of known) {
      if (!now.has(clientId)) {
        playing.delete(clientId);

        if (accountId !== null) {
          touched.add(accountId);
        }
      }
    }

    for (const [clientId, accountId] of now) {
      if (!known.has(clientId) && accountId !== null) {
        touched.add(accountId);
      }
    }

    known = now;

    for (const accountId of touched) {
      onChanged?.(accountId);
    }
  });

  return {
    list: (listener) =>
      owned(listener).map((entry) => ({
        clientId: entry.clientId,
        label: entry.deviceLabel,
        nowPlaying: playing.get(entry.clientId) ?? null,
      })),

    report: (listener, clientId, nowPlaying) => {
      if (!owned(listener).some((entry) => entry.clientId === clientId)) {
        return false;
      }

      if (nowPlaying === null) {
        playing.delete(clientId);
      } else {
        playing.set(clientId, nowPlaying);
      }

      onChanged?.(listener.accountId);

      return true;
    },

    playingOn: (clientId) => playing.get(clientId) ?? null,

    order: (clientId, command) =>
      playing.has(clientId) &&
      presence.tell(clientId, {
        kind: 'music',
        command,
        fromClientId: 'server',
        fromLabel: 'An administrator',
      }),

    command: (listener, fromClientId, toClientId, command) => {
      const devices = owned(listener);
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

export type { Listener, MusicDevices };

export { createMusicDevices };
