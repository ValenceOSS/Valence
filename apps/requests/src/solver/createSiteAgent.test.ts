import { describe, expect, it, vi } from 'vitest';
import { aFakeTab } from '@ValenceRequests/testing/aFakeTab';
import { createGate } from '@ValenceRequests/solver/createGate';
import { createSiteAgent } from './createSiteAgent';
import type { Cookie } from './createSiteAgent';

const A_COOKIE: Cookie = {
  name: 'cf_clearance',
  value: 'yes',
  domain: '.example.org',
  path: '/',
  expires: -1,
  httpOnly: true,
  secure: true,
  sameSite: 'None',
};

/**
 * A browser context that opens fake tabs and can be closed from outside, as a crash would.
 *
 * @returns The context, and what closes it.
 */
const aContext = () => {
  const onClose: (() => void)[] = [];
  const context = {
    newPage: vi.fn(() => Promise.resolve(aFakeTab().tab)),
    addCookies: vi.fn(() => Promise.resolve()),
    cookies: vi.fn(() => Promise.resolve([A_COOKIE])),
    close: vi.fn(() => Promise.resolve()),
    on: (_event: 'close', listener: () => void) => {
      onClose.push(listener);

      return onClose;
    },
  };

  return {
    context,
    crash: () => {
      for (const listener of onClose) {
        listener();
      }
    },
  };
};

describe('createSiteAgent', () => {
  it('keeps a tab for the next request rather than opening another', async () => {
    const { context } = aContext();
    const agent = createSiteAgent(context, 2, createGate(1));

    const first = await agent.withPage((page) => Promise.resolve(page));
    const second = await agent.withPage((page) => Promise.resolve(page));

    expect(first).toBe(second);
    expect(context.newPage).toHaveBeenCalledTimes(1);
  });

  it('closes a tab that failed rather than keeping it', async () => {
    const { context } = aContext();
    const agent = createSiteAgent(context, 1, createGate(1));

    await expect(agent.withPage(() => Promise.reject(new Error('gone')))).rejects.toThrow('gone');
    await agent.withPage(() => Promise.resolve());

    expect(context.newPage).toHaveBeenCalledTimes(2);
  });

  it('passes over a kept tab that has been closed since, and opens another', async () => {
    const { context } = aContext();
    const agent = createSiteAgent(context, 1, createGate(1));

    const first = await agent.withPage((page) => Promise.resolve(page));

    await first.close();

    const second = await agent.withPage((page) => Promise.resolve(page));

    expect(second).not.toBe(first);
    expect(context.newPage).toHaveBeenCalledTimes(2);
  });

  it('opens a tab only when the browser’s turn for opening comes round', async () => {
    const { context } = aContext();
    const order: string[] = [];
    const agent = createSiteAgent(context, 1, {
      run: async (task) => {
        order.push('turn');

        return task();
      },
    });

    context.newPage.mockImplementationOnce(() => {
      order.push('open');

      return Promise.resolve(aFakeTab().tab);
    });

    await agent.withPage(() => Promise.resolve());

    expect(order).toEqual(['turn', 'open']);
  });

  it('sets the cookies it is given for the site, and none where there are none', async () => {
    const { context } = aContext();
    const agent = createSiteAgent(context, 1, createGate(1));

    await agent.addCookies([], 'https://example.org');
    expect(context.addCookies).not.toHaveBeenCalled();

    await agent.addCookies([{ name: 'uid', value: '7' }], 'https://example.org');
    expect(context.addCookies).toHaveBeenCalledWith([
      { name: 'uid', value: '7', url: 'https://example.org' },
    ]);
    expect(await agent.cookies('https://example.org/')).toEqual([A_COOKIE]);
  });

  it('reads the user agent once', async () => {
    const agent = createSiteAgent(aContext().context, 1, createGate(1));
    const page = await agent.withPage((one) => Promise.resolve(one));

    await agent.userAgent(page);
    expect(await agent.userAgent(page)).toContain('Firefox');
  });

  it('says how busy it is, and knows when its context has gone', async () => {
    const { context, crash } = aContext();
    const agent = createSiteAgent(context, 1, createGate(1));
    const held: { finish?: () => void } = {};
    const working = agent.withPage(
      () =>
        new Promise<void>((resolve) => {
          held.finish = resolve;
        }),
    );

    await vi.waitFor(() => {
      expect(held.finish).toBeDefined();
    });
    expect(agent.busy()).toBe(1);
    held.finish?.();
    await working;
    expect(agent.busy()).toBe(0);

    expect(agent.isOpen()).toBe(true);
    crash();
    expect(agent.isOpen()).toBe(false);
  });

  it('closes its context, even one that will not close cleanly', async () => {
    const { context } = aContext();
    const agent = createSiteAgent(context, 1, createGate(1));

    context.close.mockRejectedValueOnce(new Error('already closed'));
    await agent.close();

    expect(agent.isOpen()).toBe(false);
  });
});
