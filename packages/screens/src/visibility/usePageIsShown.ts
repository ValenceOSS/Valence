import { useSyncExternalStore } from 'react';

/**
 * Listens for the page being hidden or shown again.
 *
 * @param changed - Told whenever it is.
 * @returns How to stop listening.
 */
const listen = (changed: () => void): (() => void) => {
  document.addEventListener('visibilitychange', changed);

  return () => {
    document.removeEventListener('visibilitychange', changed);
  };
};

/**
 * Whether anybody can see the page: false while its tab is in the background, or the desktop window
 * is minimised or behind another, and true again once it is shown.
 *
 * A page that keeps drawing while hidden does more than waste the work. The browser stops servicing
 * animations in a hidden page, so the animations and transitions of every element replaced while it
 * is hidden are never cancelled, and each keeps its element, and everything under it, alive until the
 * page is shown again. A page that updates on a timer or from the socket grows for as long as it is
 * left behind another window. Live feeds stop while this is false and catch up when it is true.
 *
 * @returns Whether the page is showing.
 */
const usePageIsShown = (): boolean =>
  useSyncExternalStore(
    listen,
    () => document.visibilityState === 'visible',
    () => true,
  );

export { usePageIsShown };
