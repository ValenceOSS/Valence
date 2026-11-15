type Seen = {
  clientId: string;
  fromServer: string | null;
  connectedAt: number;
};

/**
 * The sessions from linked servers that have gone quiet: nothing heard from them for longer than a
 * player ever leaves between heartbeats. A linked server's session has no connection here to close,
 * and one played straight from the file has nothing for its server to stop, so without this a
 * session the viewer left stayed on the list for good. A session that never reported is measured
 * from when it began.
 *
 * @param seen - Every session as presence lists it.
 * @param heardAgo - How long since a session last reported, where it ever has.
 * @param now - The time now.
 * @param quietForMs - How long a session may go unheard.
 * @returns The ids of the sessions to let go.
 */
const quietLinkedViewers = (
  seen: readonly Seen[],
  heardAgo: (clientId: string) => number | null,
  now: number,
  quietForMs: number,
): string[] =>
  seen
    .filter(
      (one) =>
        one.fromServer !== null && (heardAgo(one.clientId) ?? now - one.connectedAt) > quietForMs,
    )
    .map((one) => one.clientId);

export { quietLinkedViewers };
