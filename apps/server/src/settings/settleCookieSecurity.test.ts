import { describe, expect, it, vi } from 'vitest';
import { settleCookieSecurity } from './settleCookieSecurity';

/**
 * Makes a settings store holding one cookie setting, which records what is written to it.
 *
 * @param cookieSecure - What setup chose.
 * @returns The store.
 */
const storedAs = (cookieSecure: boolean) => {
  let held = { cookieSecure };

  return {
    read: vi.fn(() => Promise.resolve(held)),
    write: vi.fn((patch: Partial<{ cookieSecure: boolean }>) => {
      held = { ...held, ...patch };

      return Promise.resolve(held);
    }),
  };
};

describe('settleCookieSecurity', () => {
  it('lets the environment change what setup chose', async () => {
    const settings = storedAs(true);

    expect((await settleCookieSecurity(settings, false)).cookieSecure).toBe(false);
    expect(settings.write).toHaveBeenCalledWith({ cookieSecure: false });
  });

  it('keeps what setup chose where the environment says nothing', async () => {
    const settings = storedAs(true);

    expect((await settleCookieSecurity(settings, undefined)).cookieSecure).toBe(true);
    expect(settings.write).not.toHaveBeenCalled();
  });

  it('writes nothing where the two already agree', async () => {
    const settings = storedAs(false);

    await settleCookieSecurity(settings, false);

    expect(settings.write).not.toHaveBeenCalled();
  });
});
