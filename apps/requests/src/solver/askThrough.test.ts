import { describe, expect, it } from 'vitest';
import { aSitePage } from '@ValenceRequests/testing/aSitePage';
import { anAnswer } from '@ValenceRequests/testing/anAnswer';
import { askThrough } from './askThrough';

const A_GET = {
  url: 'https://example.org/search?q=a',
  method: 'GET' as const,
  body: null,
  headers: {},
};

describe('askThrough', () => {
  it('asks from inside the tab and says what the site said', async () => {
    const page = aSitePage({ origin: 'https://example.org' });

    const solved = await askThrough(page, A_GET);

    expect(page.fetch).toHaveBeenCalledWith(A_GET);
    expect(page.visit).not.toHaveBeenCalled();
    expect(solved?.answer.status).toBe(200);
    expect(solved?.bytes.toString()).toBe('<title>Search</title>');
  });

  it('gives nothing back where the check stands in the way, and does not go through it', async () => {
    const page = aSitePage({
      origin: 'https://example.org',
      answers: [
        anAnswer({
          status: 403,
          headers: { server: 'cloudflare', 'content-type': 'text/html' },
          body: '<title>Just a moment...</title>',
        }),
      ],
    });

    await expect(askThrough(page, A_GET)).resolves.toBeNull();
    expect(page.clickTurnstile).not.toHaveBeenCalled();
  });

  it('fails at once where the site’s Cloudflare refuses the address', async () => {
    const page = aSitePage({
      origin: 'https://example.org',
      answers: [
        anAnswer({
          status: 403,
          headers: { server: 'cloudflare' },
          body: 'Sorry, you have been blocked',
        }),
      ],
    });

    await expect(askThrough(page, A_GET)).rejects.toMatchObject({
      problemCode: 'CloudflareRefusesAddress',
    });
  });
});
