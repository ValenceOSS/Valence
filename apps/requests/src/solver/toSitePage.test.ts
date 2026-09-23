import { describe, expect, it } from 'vitest';
import { aFakeTab } from '@ValenceRequests/testing/aFakeTab';
import { fetchHere } from './fetchHere';
import { toSitePage } from './toSitePage';

const THE_CHECK = '<html><title>Just a moment...</title></html>';

describe('toSitePage', () => {
  it('says which site the tab is on, and nothing for a blank one', async () => {
    const { tab } = aFakeTab();
    const page = toSitePage(tab);

    expect(page.origin()).toBe('null');
    expect(await page.visit('https://example.org/search?q=a', 1000)).toBe('visited');
    expect(tab.goto).toHaveBeenCalledWith('https://example.org/search?q=a', {
      waitUntil: 'commit',
      timeout: 1000,
    });
    expect(tab.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 1000 });
    expect(page.origin()).toBe('https://example.org');
  });

  it('takes nothing for a site from an address that is not one', () => {
    expect(toSitePage(aFakeTab({ url: 'not an address' }).tab).origin()).toBe('null');
  });

  it('waits only a moment for a page that is never read, such as a picture', async () => {
    const { tab } = aFakeTab();

    tab.waitForLoadState.mockRejectedValueOnce(new Error('Timeout 5000ms exceeded'));

    expect(await toSitePage(tab).visit('https://example.org/cover.jpg', 60_000)).toBe('visited');
    expect(tab.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 5000 });
  });

  it('knows a visit that turned into a download', async () => {
    const page = toSitePage(
      aFakeTab({ goto: () => Promise.reject(new Error('page.goto: Download is starting')) }).tab,
    );

    expect(await page.visit('https://example.org/file.torrent', 1000)).toBe('download');
  });

  it('passes on a visit that failed any other way', async () => {
    const page = toSitePage(
      aFakeTab({ goto: () => Promise.reject(new Error('NS_ERROR_UNKNOWN_HOST')) }).tab,
    );

    await expect(page.visit('https://nowhere.invalid/', 1000)).rejects.toThrow(
      'NS_ERROR_UNKNOWN_HOST',
    );
  });

  it('judges the page by the last document the tab itself was sent', async () => {
    const { tab, hear } = aFakeTab({ content: THE_CHECK });
    const page = toSitePage(tab);

    expect(await page.standing()).toBe('clear');

    hear(403, { server: 'cloudflare' });
    expect(await page.standing()).toBe('challenged');

    hear(200, { server: 'cloudflare' }, { isMain: false });
    hear(200, { server: 'cloudflare' }, { isNavigation: false });
    expect(await page.standing()).toBe('challenged');

    hear(200, {});
    expect(await page.standing()).toBe('clear');
  });

  it('takes a page that cannot be read as it moves on for the check still', async () => {
    const { tab, hear } = aFakeTab({ content: null });
    const page = toSitePage(tab);

    hear(200, {});

    expect(await page.standing()).toBe('challenged');
  });

  it('clicks the box inside the check’s frame', async () => {
    const { tab } = aFakeTab({
      frames: [
        { url: 'https://example.org/', box: { x: 0, y: 0, width: 800, height: 600 } },
        {
          url: 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/turnstile',
          box: { x: 100, y: 200, width: 300, height: 65 },
        },
      ],
    });

    expect(await toSitePage(tab).clickTurnstile()).toBe(true);
    expect(tab.mouse.click).toHaveBeenCalledWith(121, 232.5);
  });

  it('clicks nothing where the box is not there or not drawn yet', async () => {
    const hidden = aFakeTab({
      frames: [{ url: 'https://challenges.cloudflare.com/x', box: null }],
    });
    const apart = aFakeTab({
      frames: [{ url: 'https://challenges.cloudflare.com/x', box: 'unreachable' }],
    });

    expect(await toSitePage(aFakeTab().tab).clickTurnstile()).toBe(false);
    expect(await toSitePage(hidden.tab).clickTurnstile()).toBe(false);
    expect(await toSitePage(apart.tab).clickTurnstile()).toBe(false);
    expect(hidden.tab.mouse.click).not.toHaveBeenCalled();
  });

  it('asks from inside the tab and checks what comes back', async () => {
    const request = {
      url: 'https://example.org/',
      method: 'GET' as const,
      body: null,
      headers: {},
    };
    const { tab } = aFakeTab({
      answer: JSON.stringify({
        url: 'https://example.org/',
        status: 200,
        headers: {},
        dataUrl: 'data:,',
      }),
    });

    expect((await toSitePage(tab).fetch(request)).status).toBe(200);
    expect(tab.evaluate).toHaveBeenCalledWith(fetchHere, request);

    await expect(
      toSitePage(aFakeTab({ answer: '{"status":"fine"}' }).tab).fetch(request),
    ).rejects.toThrow();
  });

  it('reads the browser’s user agent, and closes the tab', async () => {
    const { tab } = aFakeTab();
    const page = toSitePage(tab);

    expect(await page.userAgent()).toContain('Firefox');
    await page.close();
    expect(tab.close).toHaveBeenCalled();
  });
});
