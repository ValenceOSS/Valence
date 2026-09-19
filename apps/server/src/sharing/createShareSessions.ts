type ShareSessions = {
  claim: (sessionId: string, shareId: string) => void;
  isClaimedBy: (sessionId: string, shareId: string) => boolean;
  release: (sessionId: string, shareId: string) => void;
};

/**
 * Remembers which shares started which playback session, so that the delivery URLs a manifest
 * points at can be checked against the link that opened them. A session identifier is the only
 * thing those URLs carry — there is no item in the path — so without this a guest holding one share
 * could fetch the segments of a session belonging to another.
 *
 * Several shares at once, not one. A session is addressed by what it contains, so two links to the
 * same film send both guests to the same session, and recording a single claimant meant the second
 * to press play evicted the first: a guest was refused their own stream part way through because
 * somebody else had opened a different link to the same film. Every share that started a session
 * holds a claim on it, and lets go of its own.
 *
 * Counted rather than held once, for the same reason one place further in. A player that restarts
 * — a different rung, a different audio track, or a component mounted twice — starts a second
 * session before it stops the first, and both are the same session because both describe the same
 * thing. Letting go once then released a claim the live player was still using, and every segment
 * it asked for afterwards came back refused. A claim goes when the last of them lets go.
 *
 * Held in memory rather than in Postgres because a session is already an in-memory, ephemeral thing:
 * a restart ends every session, and a claim that outlived one would be a claim on nothing.
 *
 * @returns The registry.
 */
const createShareSessions = (): ShareSessions => {
  const claimed = new Map<string, Map<string, number>>();

  return {
    claim: (sessionId, shareId) => {
      const holding = claimed.get(sessionId) ?? new Map<string, number>();

      holding.set(shareId, (holding.get(shareId) ?? 0) + 1);
      claimed.set(sessionId, holding);
    },

    isClaimedBy: (sessionId, shareId) => (claimed.get(sessionId)?.get(shareId) ?? 0) > 0,

    release: (sessionId, shareId) => {
      const holding = claimed.get(sessionId);
      const held = holding?.get(shareId);

      if (holding === undefined || held === undefined) {
        return;
      }

      if (held > 1) {
        holding.set(shareId, held - 1);

        return;
      }

      holding.delete(shareId);

      if (holding.size === 0) {
        claimed.delete(sessionId);
      }
    },
  };
};

export type { ShareSessions };

export { createShareSessions };
