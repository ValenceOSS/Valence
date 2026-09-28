import { describe, expect, it } from 'vitest';
import { SOLVER_NOT_USED } from '@ValenceContracts/schemas/Requests';
import { createSolverWatch } from './createSolverWatch';

const NOW = Date.parse('2026-09-28T12:00:00.000Z');

const A_REQUEST = { url: 'https://site.test/', method: 'GET' as const, body: null, headers: {} };

const A_SOLUTION = {
  url: 'https://site.test/',
  status: 200,
  headers: {},
  bytes: Buffer.from('page'),
  cookies: {},
  userAgent: 'Firefox',
};

/**
 * A watch over a browser that is up or not, as told.
 *
 * @param isRunning - Whether the browser is up.
 * @returns The watch.
 */
const aWatch = (isRunning = false) =>
  createSolverWatch({
    isRunning: () => isRunning,
    runningFor: () => 60_000,
    sites: () => 2,
    now: () => NOW,
  });

describe('createSolverWatch', () => {
  it('says nothing has happened before anything asks for the browser', () => {
    expect(aWatch().current()).toEqual(SOLVER_NOT_USED);
  });

  it('says how long the browser has been up and how many sites it has open', () => {
    expect(aWatch(true).current()).toMatchObject({
      isRunning: true,
      sites: 2,
      runningSince: '2026-09-28T11:59:00.000Z',
    });
  });

  it('counts a request that got through', async () => {
    const watch = aWatch();
    const solver = watch.watching({ fetch: () => Promise.resolve(A_SOLUTION) });

    await expect(solver.fetch(A_REQUEST, {}, 'search')).resolves.toBe(A_SOLUTION);

    expect(watch.current()).toMatchObject({
      passed: 1,
      failed: 0,
      lastPassedAt: '2026-09-28T12:00:00.000Z',
    });
  });

  it('counts a request that failed, and keeps why', async () => {
    const watch = aWatch();
    const solver = watch.watching({
      fetch: () => Promise.reject(new Error('Timed out at the check')),
    });

    await expect(solver.fetch(A_REQUEST, {}, 'search')).rejects.toThrow('Timed out at the check');

    expect(watch.current()).toMatchObject({
      failed: 1,
      lastFailedAt: '2026-09-28T12:00:00.000Z',
      problem: 'Timed out at the check',
    });
  });

  it('keeps why the browser would not start, until it next does', async () => {
    const watch = aWatch();
    let works = false;
    const launch = watch.starting(() =>
      works ? Promise.resolve('browser') : Promise.reject(new Error('No browser installed')),
    );

    await expect(launch()).rejects.toThrow('No browser installed');

    expect(watch.current().startProblem).toBe('No browser installed');

    works = true;
    await launch();

    expect(watch.current().startProblem).toBeNull();
  });
});
