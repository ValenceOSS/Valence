import { describe, expect, it, vi } from 'vitest';
import { aSitePage } from '@ValenceRequests/testing/aSitePage';
import { anAnswer } from '@ValenceRequests/testing/anAnswer';
import { solveRequest } from './solveRequest';

const A_GET = {
  url: 'https://example.org/search?q=a',
  method: 'GET' as const,
  body: null,
  headers: {},
};

const A_POST = {
  url: 'https://example.org/login',
  method: 'POST' as const,
  body: 'user=a',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
};

const THE_CHECK = anAnswer({
  status: 403,
  headers: { server: 'cloudflare', 'content-type': 'text/html' },
  body: '<title>Just a moment...</title>',
});

const A_BLOCK = anAnswer({
  status: 403,
  headers: { server: 'cloudflare' },
  body: 'Sorry, you have been blocked',
});

const wait = vi.fn(() => Promise.resolve());

describe('solveRequest', () => {
  it('goes to the site first, then asks from inside it', async () => {
    const page = aSitePage();

    const solved = await solveRequest({
      page,
      request: A_GET,
      deadline: Date.now() + 60_000,
      wait,
    });

    expect(page.visit).toHaveBeenCalledWith(A_GET.url, expect.any(Number));
    expect(page.fetch).toHaveBeenCalledWith(A_GET);
    expect(solved.bytes.toString()).toBe('<title>Search</title>');
    expect(solved.answer.status).toBe(200);
  });

  it('asks straight away of a site it is already on', async () => {
    const page = aSitePage({ origin: 'https://example.org' });

    await solveRequest({ page, request: A_GET, deadline: Date.now() + 60_000, wait });

    expect(page.visit).not.toHaveBeenCalled();
  });

  it('goes to the front page to send a form, not to the form’s address', async () => {
    const page = aSitePage();

    await solveRequest({ page, request: A_POST, deadline: Date.now() + 60_000, wait });

    expect(page.visit).toHaveBeenCalledWith('https://example.org/', expect.any(Number));
    expect(page.fetch).toHaveBeenCalledWith(A_POST);
  });

  it('goes to the front page where the address was a download', async () => {
    const page = aSitePage({ visits: ['download'] });

    await solveRequest({ page, request: A_GET, deadline: Date.now() + 60_000, wait });

    expect(page.visit).toHaveBeenLastCalledWith('https://example.org/', expect.any(Number));
  });

  it('clicks the box and waits while the check shows', async () => {
    const page = aSitePage({
      standings: ['challenged', 'challenged', 'challenged'],
      clicks: [false, true],
    });

    await solveRequest({ page, request: A_GET, deadline: Date.now() + 60_000, wait });

    expect(page.clickTurnstile).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledWith(1000);
    expect(wait).toHaveBeenCalledWith(3000);
  });

  it('gives up on a check that will not let go in time', async () => {
    let clock = 0;
    const page = aSitePage({ standings: Array.from({ length: 100 }, () => 'challenged' as const) });

    await expect(
      solveRequest({
        page,
        request: A_GET,
        deadline: 5000,
        now: () => clock,
        wait: (ms) => {
          clock += ms;

          return Promise.resolve();
        },
      }),
    ).rejects.toThrow('Timed out getting past the site’s browser check');
  });

  it('gives up at once on a site that refuses the address outright', async () => {
    await expect(
      solveRequest({
        page: aSitePage({ standings: ['blocked'] }),
        request: A_GET,
        deadline: Date.now() + 60_000,
        wait,
      }),
    ).rejects.toThrow('refuses this address outright');

    await expect(
      solveRequest({
        page: aSitePage({ origin: 'https://example.org', answers: [A_BLOCK] }),
        request: A_GET,
        deadline: Date.now() + 60_000,
        wait,
      }),
    ).rejects.toThrow('refuses this address outright');
  });

  it('goes through the check again where the request itself meets it', async () => {
    const page = aSitePage({ origin: 'https://example.org', answers: [THE_CHECK] });

    await solveRequest({ page, request: A_POST, deadline: Date.now() + 60_000, wait });

    expect(page.visit).toHaveBeenCalledWith('https://example.org/', expect.any(Number));
    expect(page.fetch).toHaveBeenCalledTimes(2);
  });

  it('waits a second between looks unless told how to wait', async () => {
    vi.useFakeTimers();

    const solving = solveRequest({
      page: aSitePage({ standings: ['challenged'] }),
      request: A_GET,
      deadline: Date.now() + 60_000,
    });

    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();

    expect((await solving).answer.status).toBe(200);
  });

  it('gives up where the check stands in the way of the request twice', async () => {
    const page = aSitePage({ origin: 'https://example.org', answers: [THE_CHECK, THE_CHECK] });

    await expect(
      solveRequest({ page, request: A_GET, deadline: Date.now() + 60_000, wait }),
    ).rejects.toThrow('would not let the request through');
  });

  it('names the kind of each failure, so the admin area can link to what explains it', async () => {
    let clock = 0;

    await expect(
      solveRequest({
        page: aSitePage({ standings: ['blocked'] }),
        request: A_GET,
        deadline: Date.now() + 60_000,
        wait,
      }),
    ).rejects.toMatchObject({ problemCode: 'CloudflareRefusesAddress' });
    await expect(
      solveRequest({
        page: aSitePage({ standings: Array.from({ length: 100 }, () => 'challenged' as const) }),
        request: A_GET,
        deadline: 5000,
        now: () => clock,
        wait: (ms) => {
          clock += ms;

          return Promise.resolve();
        },
      }),
    ).rejects.toMatchObject({ problemCode: 'CloudflareCheckFailed' });
    await expect(
      solveRequest({
        page: aSitePage({ origin: 'https://example.org', answers: [THE_CHECK, THE_CHECK] }),
        request: A_GET,
        deadline: Date.now() + 60_000,
        wait,
      }),
    ).rejects.toMatchObject({ problemCode: 'CloudflareCheckFailed' });
  });
});
