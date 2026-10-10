/**
 * Reads a linked server again a moment after it says it changed, rather than at once, so a scan that
 * tells of several changes in a row is read once, after the last.
 *
 * @param sync - How one linked server is read again.
 * @param waitMs - How long to wait after the last word from a server.
 * @returns A way to ask for a server to be read again soon.
 */
const createSoonSync = (
  sync: (serverId: string) => Promise<unknown>,
  waitMs: number,
): ((serverId: string) => void) => {
  const waiting = new Map<string, ReturnType<typeof setTimeout>>();

  return (serverId) => {
    clearTimeout(waiting.get(serverId));
    waiting.set(
      serverId,
      setTimeout(() => {
        waiting.delete(serverId);
        void sync(serverId).catch(() => undefined);
      }, waitMs),
    );
  };
};

export { createSoonSync };
