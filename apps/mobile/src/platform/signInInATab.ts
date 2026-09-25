import { AppState, Linking } from 'react-native';

const A_WAY_BACK = 'valence://';

const BACK_WITHOUT_AN_ANSWER_MS = 1000;

/**
 * Waits for a page opened in Android's browser tab to send the tab back to the app, the way the
 * browser sheet answers on an iPhone.
 *
 * The page ends by sending the tab to `valence://`, which Android hands the app as a link. Somebody
 * who closes the tab comes back to the app with no link, and a moment after the app is in front
 * again with none, that is taken as their having changed their mind.
 *
 * @param address - The whole address of the page to open.
 * @param openInATab - Opens the address in the tab.
 * @returns Where the page sent the tab, or null where somebody closed it first. Rejects where the
 *   tab could not be opened.
 */
const signInInATab = (
  address: string,
  openInATab: (address: string) => Promise<void>,
): Promise<string | null> =>
  new Promise((settle, fail) => {
    let isSettled = false;
    let hasLeft = false;
    let waiting: ReturnType<typeof setTimeout> | null = null;

    const finish = (came: string | null): void => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      linking.remove();
      coming.remove();

      if (waiting !== null) {
        clearTimeout(waiting);
      }

      settle(came);
    };

    const linking = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith(A_WAY_BACK)) {
        finish(url);
      }
    });

    const coming = AppState.addEventListener('change', (now) => {
      if (now !== 'active') {
        hasLeft = true;

        return;
      }

      if (hasLeft && waiting === null) {
        waiting = setTimeout(() => {
          finish(null);
        }, BACK_WITHOUT_AN_ANSWER_MS);
      }
    });

    openInATab(address).catch(() => {
      if (!isSettled) {
        isSettled = true;
        linking.remove();
        coming.remove();
        fail(new Error('The tab would not open.'));
      }
    });
  });

export { signInInATab };
