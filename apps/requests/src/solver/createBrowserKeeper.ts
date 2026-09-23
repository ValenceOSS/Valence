import type { Browser } from 'playwright-core';

type BrowserLike = Pick<Browser, 'isConnected' | 'close' | 'newContext'>;

type CreateBrowserKeeperOptions<T extends BrowserLike> = {
  launch: () => Promise<T>;
  now?: () => number;
};

/**
 * Keeps one browser running for every site to share, launching it when first wanted and again
 * whenever it has gone, so that nobody pays for a browser starting up but the first.
 *
 * @param launch - Starts a browser.
 * @param now - The clock.
 * @returns The keeper: `get` the browser, how long it has been up, and `retire` it.
 */
const createBrowserKeeper = <T extends BrowserLike>({
  launch,
  now = Date.now,
}: CreateBrowserKeeperOptions<T>) => {
  let current: { browser: Promise<T>; since: number } | null = null;

  const get = async (): Promise<T> => {
    if (current !== null) {
      const browser = await current.browser.catch(() => null);

      if (browser?.isConnected() === true) {
        return browser;
      }
    }

    const launching = launch();

    current = { browser: launching, since: now() };

    return launching;
  };

  const retire = async (): Promise<void> => {
    const retiring = current;

    current = null;
    await retiring?.browser.then((browser) => browser.close()).catch(() => {});
  };

  const upFor = (): number => (current === null ? 0 : now() - current.since);

  return { get, retire, upFor };
};

type BrowserKeeper<T extends BrowserLike> = ReturnType<typeof createBrowserKeeper<T>>;

export type { BrowserKeeper, BrowserLike };

export { createBrowserKeeper };
