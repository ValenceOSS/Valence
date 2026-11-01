type EndedSignIns = { accountId: string } | { sessionIds: readonly string[] };

type SignedInSockets = {
  hold: (held: { sessionId: string; accountId: string }, close: () => void) => () => void;
  close: (ended: EndedSignIns) => void;
};

/**
 * Keeps the open sockets of everybody signed in by the sign-in each was opened with, so a sign-in
 * that is ended closes its sockets too, rather than leaving a device hearing what its account is
 * told until it happens to disconnect.
 *
 * @returns The sockets.
 */
const createSignedInSockets = (): SignedInSockets => {
  const open = new Map<() => void, { sessionId: string; accountId: string }>();

  return {
    hold: (held, close) => {
      open.set(close, held);

      return () => {
        open.delete(close);
      };
    },
    close: (ended) => {
      const sessionIds = 'sessionIds' in ended ? new Set(ended.sessionIds) : null;

      for (const [close, held] of open) {
        const isEnded =
          sessionIds === null
            ? 'accountId' in ended && held.accountId === ended.accountId
            : sessionIds.has(held.sessionId);

        if (isEnded) {
          open.delete(close);
          close();
        }
      }
    },
  };
};

export type { EndedSignIns, SignedInSockets };

export { createSignedInSockets };
