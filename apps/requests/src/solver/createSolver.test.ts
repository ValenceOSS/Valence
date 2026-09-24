import { describe, expect, it, vi } from 'vitest';
import { createSitePool } from '@ValenceRequests/solver/createSitePool';
import { aSitePage } from '@ValenceRequests/testing/aSitePage';
import { anAnswer } from '@ValenceRequests/testing/anAnswer';
import type { Cookie } from '@ValenceRequests/solver/createSiteAgent';
import { createSolver } from './createSolver';

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
 * A solver over agents whose tabs play out the script given.
 *
 * @param page - The tab every agent works in.
 * @returns The solver, its pool, the tab, and the agents' cookie setter.
 */
const aSolver = (page = aSitePage()) => {
  const addCookies = vi.fn(() => Promise.resolve());
  const pool = createSitePool({
    open: () =>
      Promise.resolve({
        withPage: <T>(task: (one: typeof page) => Promise<T>) => task(page),
        addCookies,
        cookies: () => Promise.resolve([A_COOKIE]),
        userAgent: () => Promise.resolve('Mozilla/5.0 (X11; Linux x86_64) Firefox/152.0'),
        busy: () => 0,
        isOpen: () => true,
        close: () => Promise.resolve(),
      }),
    most: 4,
    idleMs: 60_000,
    restartMs: 3_600_000,
    upFor: () => 0,
    retire: () => Promise.resolve(),
  });

  return { solver: createSolver({ pool }), pool, page, addCookies };
};

const A_GET = {
  url: 'https://example.org/search?q=a',
  method: 'GET' as const,
  body: null,
  headers: {},
};

describe('createSolver', () => {
  it('fetches a page with the session’s cookies and says what the site said', async () => {
    const { solver, page, addCookies } = aSolver(
      aSitePage({ answers: [anAnswer({ url: 'https://example.org/search?q=a', body: 'café' })] }),
    );

    const solution = await solver.fetch(A_GET, { uid: '7' }, 'one');

    expect(solution).toEqual({
      url: 'https://example.org/search?q=a',
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      bytes: Buffer.from('café'),
      cookies: { cf_clearance: 'yes' },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/152.0',
    });
    expect(addCookies).toHaveBeenCalledWith([{ name: 'uid', value: '7' }], 'https://example.org');
    expect(page.fetch).toHaveBeenCalledWith(A_GET);
  });

  it('sends a form as a form, leaving the browser’s own headers to the browser', async () => {
    const { solver, page } = aSolver();

    await solver.fetch(
      {
        url: 'https://example.org/login',
        method: 'POST',
        body: 'user=a',
        headers: { 'User-Agent': 'Other/1.0', Cookie: 'a=b', 'X-Requested-With': 'XMLHttpRequest' },
      },
      {},
      'one',
    );

    expect(page.fetch).toHaveBeenCalledWith({
      url: 'https://example.org/login',
      method: 'POST',
      body: 'user=a',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  });

  it('gives each session its own agent on a site, and keeps it for the session', async () => {
    const { solver, pool } = aSolver();

    await solver.fetch(A_GET, {}, 'one');
    await solver.fetch({ ...A_GET, url: 'https://example.org/other' }, {}, 'one');
    await solver.fetch(A_GET, {}, 'two');

    expect(pool.has('example.org one')).toBe(true);
    expect(pool.has('example.org two')).toBe(true);
    expect(pool.has('example.org')).toBe(false);
  });

  it('gives up on a request that runs past its time', async () => {
    const { pool } = aSolver(
      aSitePage({ standings: Array.from({ length: 1000 }, () => 'challenged' as const) }),
    );
    const solver = createSolver({ pool, timeoutMs: 5000 });

    vi.useFakeTimers();

    const failing = expect(solver.fetch(A_GET, {}, 'one')).rejects.toThrow(
      'Timed out after 5 seconds',
    );

    await vi.advanceTimersByTimeAsync(10_000);
    vi.useRealTimers();
    await failing;
  });

  it('closes the tab of a request that runs past its time, so it holds nothing up', async () => {
    const page = aSitePage();

    page.visit.mockImplementation(() => new Promise(() => undefined));

    const { pool } = aSolver(page);
    const solver = createSolver({ pool, timeoutMs: 5000 });

    vi.useFakeTimers();

    const failing = expect(solver.fetch(A_GET, {}, 'one')).rejects.toThrow('Timed out');

    await vi.advanceTimersByTimeAsync(5000);
    vi.useRealTimers();
    await failing;

    expect(page.close).toHaveBeenCalled();
  });
});
