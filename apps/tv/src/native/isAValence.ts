const GIVE_IT_MILLISECONDS = 3000;

/**
 * Asks an address whether there is a Valence behind it.
 *
 * Health is the one thing a server answers to nobody in particular, so it can be asked before anybody
 * has signed in or chosen anything. A television is often on a slower network than the desk, so it
 * waits a little longer than the desktop does before deciding nothing is there.
 *
 * @param address - Where a Valence might be.
 * @returns Whether one answered.
 */
const isAValence = async (address: string): Promise<boolean> => {
  const giveUp = new AbortController();
  const timer = setTimeout(() => {
    giveUp.abort();
  }, GIVE_IT_MILLISECONDS);

  try {
    const answered = await fetch(`${address}/api/health`, {
      headers: { accept: 'application/json' },
      signal: giveUp.signal,
    });

    return answered.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

export { isAValence };
