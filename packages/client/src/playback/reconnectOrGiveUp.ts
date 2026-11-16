const WITHIN_MS = 60_000;

const MOST_COMEBACKS = 3;

/**
 * Whether to ask for the stream again now the server answers once more, or give up because it has
 * answered and the stream has still failed three times in the last minute: the server is up, so
 * asking again for the same stream would only loop.
 *
 * @param comebacks - When the server answered after each recent failure, newest last.
 * @param nowMs - The time now.
 * @returns Whether to ask again, and the times to remember if so.
 */
const reconnectOrGiveUp = (
  comebacks: readonly number[],
  nowMs: number,
): { shouldReconnect: true; comebacks: number[] } | { shouldReconnect: false } => {
  const recent = comebacks.filter((atMs) => nowMs - atMs <= WITHIN_MS);

  return recent.length >= MOST_COMEBACKS
    ? { shouldReconnect: false }
    : { shouldReconnect: true, comebacks: [...recent, nowMs] };
};

export { reconnectOrGiveUp };
