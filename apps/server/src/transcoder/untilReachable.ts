const EVERY_MS = 500;

/**
 * Waits for the media service to answer before work that needs it starts, giving up after a while
 * so a service that never comes does not keep anything else from starting.
 *
 * @param isReachable - Whether the media service answers now.
 * @param mostMs - How long to wait at most.
 * @param wait - How to wait between asking.
 * @returns Whether it answered.
 */
const untilReachable = async (
  isReachable: () => Promise<boolean>,
  mostMs: number,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
): Promise<boolean> => {
  for (let waited = 0; waited < mostMs; waited += EVERY_MS) {
    if (await isReachable().catch(() => false)) {
      return true;
    }

    await wait(EVERY_MS);
  }

  return isReachable().catch(() => false);
};

export { untilReachable };
