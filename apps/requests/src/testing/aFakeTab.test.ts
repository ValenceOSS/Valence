import { describe, expect, it, vi } from 'vitest';
import type { ResponseLike } from '@ValenceRequests/solver/toSitePage';
import { aFakeTab } from './aFakeTab';

describe('aFakeTab', () => {
  it('goes where it is sent and says what it was given', async () => {
    const { tab, hear } = aFakeTab({
      content: '<p>hi</p>',
      answer: '{"status":200}',
      frames: [{ url: 'https://frame.example/', box: null }],
    });
    const listener = vi.fn<(response: ResponseLike) => void>();

    tab.on('response', listener);
    await tab.goto('https://example.org/');
    hear(200, {});
    hear(200, {}, { isMain: false, isNavigation: false });

    expect(tab.url()).toBe('https://example.org/');
    expect(await tab.content()).toBe('<p>hi</p>');
    expect(tab.frames()[0]?.url()).toBe('https://frame.example/');
    expect(await (await tab.frames()[0]?.frameElement())?.boundingBox()).toBeNull();
    expect(await tab.evaluate(() => '')).toContain('Firefox');
    expect(
      await tab.evaluate(() => Promise.resolve(''), {
        url: '',
        method: 'GET',
        body: null,
        headers: {},
      }),
    ).toBe('{"status":200}');
    expect(listener).toHaveBeenCalledTimes(2);
    await expect(aFakeTab({ content: null }).tab.content()).rejects.toThrow('navigating');
    await expect(
      aFakeTab({ frames: [{ url: '', box: 'unreachable' }] })
        .tab.frames()[0]
        ?.frameElement(),
    ).rejects.toThrow('adoptNode');
    expect(listener.mock.calls[0]?.[0].frame()).toBe(tab.mainFrame());
    expect(listener.mock.calls[1]?.[0].frame()).not.toBe(tab.mainFrame());
    expect(listener.mock.calls[1]?.[0].request().isNavigationRequest()).toBe(false);
  });
});
