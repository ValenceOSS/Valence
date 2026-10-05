import { useEffect } from 'react';

/**
 * Goes back and forward through a desktop window's history from the keyboard, with the keys
 * `historyKeysFor` names: command and a bracket on a Mac, alt and an arrow elsewhere.
 *
 * @param ways - Where the history can go, and how to go each way.
 * @param platform - Which operating system the window is on, as Node names it.
 */
const useHistoryKeys = (
  ways: { canGoBack: boolean; canGoForward: boolean; back: () => void; forward: () => void },
  platform: string | undefined,
): void => {
  const { canGoBack, canGoForward, back, forward } = ways;

  useEffect(() => {
    const isMac = platform === 'darwin';

    const pressed = (event: KeyboardEvent): void => {
      const isHeld = isMac ? event.metaKey && !event.altKey : event.altKey && !event.metaKey;
      const isBack = isMac ? event.key === '[' : event.key === 'ArrowLeft';
      const isForward = isMac ? event.key === ']' : event.key === 'ArrowRight';

      if (!isHeld || event.ctrlKey || event.shiftKey) {
        return;
      }

      if (isBack && canGoBack) {
        event.preventDefault();
        back();
      } else if (isForward && canGoForward) {
        event.preventDefault();
        forward();
      }
    };

    window.addEventListener('keydown', pressed);

    return () => {
      window.removeEventListener('keydown', pressed);
    };
  }, [platform, canGoBack, canGoForward, back, forward]);
};

export { useHistoryKeys };
