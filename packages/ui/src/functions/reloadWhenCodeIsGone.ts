const RELOADED_AT = 'valence-reloaded-for-new-code';

const AGAIN_AFTER_MS = 10_000;

/**
 * Reloads a page whose code was replaced by a new release while it was open, once, when part of the
 * old code it asks for has gone; a second miss within a few seconds is left to show its error, so a
 * real outage never reloads in a loop, and a page that has gone offline is never reloaded away.
 *
 * @param target - The window to watch.
 * @param now - The time now, in milliseconds.
 */
const reloadWhenCodeIsGone = (
  target: {
    addEventListener: (type: 'vite:preloadError', listener: (event: Event) => void) => void;
    location: { reload: () => void };
    navigator: { onLine: boolean };
    sessionStorage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
    };
  },
  now: () => number = Date.now,
): void => {
  target.addEventListener('vite:preloadError', (event) => {
    if (!target.navigator.onLine) {
      return;
    }

    try {
      const last = Number(target.sessionStorage.getItem(RELOADED_AT) ?? '0');

      if (now() - last < AGAIN_AFTER_MS) {
        return;
      }

      target.sessionStorage.setItem(RELOADED_AT, now().toString());
    } catch {
      return;
    }

    event.preventDefault();
    target.location.reload();
  });
};

export { reloadWhenCodeIsGone };
