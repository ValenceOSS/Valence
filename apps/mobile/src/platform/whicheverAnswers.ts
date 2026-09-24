const HEALTH = '/api/health';

const LONG_ENOUGH = 6000;

/**
 * The first of these addresses with a Valence behind it.
 *
 * Asked of each in turn rather than all at once, so the order they were offered in is the order
 * they are tried and the answer is the best guess that worked rather than the quickest to reply.
 *
 * A server that answers anything at all counts. What is asked for is the one thing every Valence
 * will say without being told who is asking, and a household running one behind something that
 * rewrites it still has a Valence there.
 *
 * Each is given only so long. An address nobody is listening on is refused at once, but one behind
 * a firewall that drops rather than refuses answers never, and a phone waiting on it looks broken.
 *
 * @param addresses - The addresses to try, best first.
 * @returns The one that answered, or nothing where none did.
 */
const whicheverAnswers = async (addresses: readonly string[]): Promise<string | null> => {
  for (const address of addresses) {
    const giveUp = new AbortController();
    const waiting = setTimeout(() => {
      giveUp.abort();
    }, LONG_ENOUGH);
    const answered = await fetch(`${address}${HEALTH}`, { signal: giveUp.signal }).catch(
      () => null,
    );

    clearTimeout(waiting);

    if (answered !== null && answered.ok) {
      return address;
    }
  }

  return null;
};

export { whicheverAnswers };
