const RELOADED_AT = 'valence-reloaded-for-new-code';

const AGAIN_AFTER_MS = 10_000;

/**
 * Reloads a page that asked for code a newer release has replaced, so it comes back on the new
 * code, but only once: a second miss within a few seconds is left alone, so a real outage never
 * reloads in a loop, and a page that has gone offline is never reloaded away.
 *
 * @param target - The window to reload.
 * @param now - The time now, in milliseconds.
 * @returns Whether it reloaded.
 */
const reloadOnceForNewCode = (
  target: {
    location: { reload: () => void };
    navigator: { onLine: boolean };
    sessionStorage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
    };
  },
  now: () => number = Date.now,
): boolean => {
  if (!target.navigator.onLine) {
    return false;
  }

  try {
    const last = Number(target.sessionStorage.getItem(RELOADED_AT) ?? '0');

    if (now() - last < AGAIN_AFTER_MS) {
      return false;
    }

    target.sessionStorage.setItem(RELOADED_AT, now().toString());
  } catch {
    return false;
  }

  target.location.reload();

  return true;
};

export { reloadOnceForNewCode };
