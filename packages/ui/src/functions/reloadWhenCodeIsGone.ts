import { reloadOnceForNewCode } from '@ValenceUI/reloadOnceForNewCode';

/**
 * Reloads a page whose code was replaced by a new release while it was open, once, when part of the
 * old code it asks for has gone; a second miss within a few seconds is left to show its error, so a
 * real outage never reloads in a loop, and a page that has gone offline is never reloaded away.
 *
 * @param target - The window to watch.
 * @param now - The time now, in milliseconds.
 */
const reloadWhenCodeIsGone = (
  target: Parameters<typeof reloadOnceForNewCode>[0] & {
    addEventListener: (type: 'vite:preloadError', listener: (event: Event) => void) => void;
  },
  now: () => number = Date.now,
): void => {
  target.addEventListener('vite:preloadError', (event) => {
    if (reloadOnceForNewCode(target, now)) {
      event.preventDefault();
    }
  });
};

export { reloadWhenCodeIsGone };
