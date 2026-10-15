/**
 * Counts what an account is streaming right now, across every device it is signed in on, leaving
 * out the device asking, whose own stream is about to be replaced rather than added to.
 *
 * @param sessions - Everybody connected, and what each is playing.
 * @param accountId - The account.
 * @param exceptClientId - The device asking, where it said which it is.
 * @returns How many streams it has running.
 */
const streamsOf = (
  sessions: readonly { clientId: string; accountId: string | null; playback: object | null }[],
  accountId: string,
  exceptClientId?: string,
): number =>
  sessions.filter(
    (session) =>
      session.accountId === accountId &&
      session.playback !== null &&
      session.clientId !== exceptClientId,
  ).length;

export { streamsOf };
