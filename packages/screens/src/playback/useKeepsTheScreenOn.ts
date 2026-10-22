import { useEffect } from 'react';

const KEEP_THE_SCREEN_ON = 'valence:keep-the-screen-on';

/**
 * Keeps the screen from dimming or turning off for as long as it is told to, as a film playing
 * does. A browser is asked for a screen wake lock where the page may hold one, which is again
 * whenever the page comes back into view, since a browser lets go of it while the page is hidden.
 * Valence's own window is told as well, since a browser offers the lock only to a page served over
 * a secure address and a server on a home network is often not one.
 *
 * @param isOn - Whether the screen should stay on.
 */
const useKeepsTheScreenOn = (isOn: boolean): void => {
  useEffect(() => {
    if (!isOn) {
      return undefined;
    }

    let lock: WakeLockSentinel | null = null;
    let isLetGo = false;

    const hold = () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') {
        return;
      }

      void navigator.wakeLock.request('screen').then(
        (held) => {
          if (isLetGo) {
            void held.release();

            return;
          }

          lock = held;
        },
        () => undefined,
      );
    };

    document.dispatchEvent(new CustomEvent(KEEP_THE_SCREEN_ON, { detail: true }));
    hold();
    document.addEventListener('visibilitychange', hold);

    return () => {
      isLetGo = true;
      document.removeEventListener('visibilitychange', hold);
      document.dispatchEvent(new CustomEvent(KEEP_THE_SCREEN_ON, { detail: false }));
      void lock?.release().catch(() => undefined);
    };
  }, [isOn]);
};

export { useKeepsTheScreenOn };
