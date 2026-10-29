import { CLIENT_KINDS } from '@ValenceContracts/schemas/ClientKind';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';

type PlaybackTally = {
  note: (kind: ClientKind, player: string) => void;
  read: () => Record<ClientKind, number>;
  clear: () => void;
};

/**
 * Counts how many different players of each kind of app started something since it was last
 * cleared, holding only the players' own ids in memory and nothing of what they played.
 *
 * @returns The tally.
 */
const createPlaybackTally = (): PlaybackTally => {
  const seen = new Map<ClientKind, Set<string>>(CLIENT_KINDS.map((kind) => [kind, new Set()]));

  return {
    note: (kind, player) => {
      seen.get(kind)?.add(player);
    },
    read: () => ({
      browser: seen.get('browser')?.size ?? 0,
      desktop: seen.get('desktop')?.size ?? 0,
      tv: seen.get('tv')?.size ?? 0,
      phone: seen.get('phone')?.size ?? 0,
    }),
    clear: () => {
      for (const players of seen.values()) {
        players.clear();
      }
    },
  };
};

export type { PlaybackTally };

export { createPlaybackTally };
