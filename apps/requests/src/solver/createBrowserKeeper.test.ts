import { describe, expect, it, vi } from 'vitest';
import { createBrowserKeeper } from './createBrowserKeeper';

/**
 * A browser that can be told it has gone.
 *
 * @returns The browser, and what disconnects it.
 */
const aBrowser = () => {
  let isConnected = true;
  const browser = {
    isConnected: () => isConnected,
    close: vi.fn(() => Promise.resolve()),
    newContext: vi.fn(),
  };

  return {
    browser,
    disconnect: () => {
      isConnected = false;
    },
  };
};

describe('createBrowserKeeper', () => {
  it('launches once and shares the one browser', async () => {
    const { browser } = aBrowser();
    const launch = vi.fn(() => Promise.resolve(browser));
    const keeper = createBrowserKeeper({ launch });

    const [first, second] = await Promise.all([keeper.get(), keeper.get()]);

    expect(first).toBe(browser);
    expect(second).toBe(browser);
    expect(launch).toHaveBeenCalledTimes(1);
  });

  it('launches again once the browser has gone', async () => {
    const one = aBrowser();
    const two = aBrowser();
    const launch = vi
      .fn<() => Promise<typeof one.browser>>()
      .mockResolvedValueOnce(one.browser)
      .mockResolvedValueOnce(two.browser);
    const keeper = createBrowserKeeper({ launch });

    await keeper.get();
    one.disconnect();

    expect(await keeper.get()).toBe(two.browser);
  });

  it('tries again after a launch that failed', async () => {
    const { browser } = aBrowser();
    const launch = vi
      .fn<() => Promise<typeof browser>>()
      .mockRejectedValueOnce(new Error('no display'))
      .mockResolvedValueOnce(browser);
    const keeper = createBrowserKeeper({ launch });

    await expect(keeper.get()).rejects.toThrow('no display');
    expect(await keeper.get()).toBe(browser);
  });

  it('says how long the browser has been up, and closes it when retired', async () => {
    let clock = 1000;
    const { browser } = aBrowser();
    const keeper = createBrowserKeeper({
      launch: () => Promise.resolve(browser),
      now: () => clock,
    });

    expect(keeper.upFor()).toBe(0);

    await keeper.get();
    clock = 5000;
    expect(keeper.upFor()).toBe(4000);

    await keeper.retire();
    expect(browser.close).toHaveBeenCalled();
    expect(keeper.upFor()).toBe(0);
  });

  it('retires quietly when there is nothing to retire, or it will not close', async () => {
    const keeper = createBrowserKeeper({ launch: () => Promise.reject(new Error('no')) });

    await keeper.retire();
    await keeper.get().catch(() => null);
    await expect(keeper.retire()).resolves.toBeUndefined();
  });
});
