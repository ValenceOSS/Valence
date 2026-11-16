import { describe, expect, it } from 'vitest';
import { judgeSweep } from './judgeSweep';
import type { SweepSample } from './SweepSample';

const sample = (route: string, pass: number, heapMb: number, nodes = 1000, listeners = 300) =>
  ({ route, pass, heapMb, nodes, listeners }) satisfies SweepSample;

describe('judgeSweep', () => {
  it('passes a page that comes back to the same size each time', () => {
    expect(
      judgeSweep([
        sample('/', 1, 40),
        sample('/', 2, 52),
        sample('/', 3, 52.5),
        sample('/', 4, 52),
      ]),
    ).toEqual([
      { route: '/', heapGrowthMb: 0, nodeGrowth: 0, listenerGrowth: 0, isLeaking: false },
    ]);
  });

  it('leaves out the first visit, which fills caches the page then keeps', () => {
    const [found] = judgeSweep([
      sample('/music', 1, 20),
      sample('/music', 2, 60),
      sample('/music', 3, 61),
    ]);

    expect(found?.heapGrowthMb).toBe(1);
    expect(found?.isLeaking).toBe(false);
  });

  it('flags a page whose heap keeps climbing', () => {
    const [found] = judgeSweep([
      sample('/admin/overview', 1, 50),
      sample('/admin/overview', 2, 55),
      sample('/admin/overview', 3, 63),
    ]);

    expect(found?.isLeaking).toBe(true);
  });

  it('flags a page that keeps its DOM nodes or its listeners', () => {
    const findings = judgeSweep([
      sample('/search', 1, 30, 1000),
      sample('/search', 2, 30, 1000),
      sample('/search', 3, 30, 1500),
      sample('/read', 1, 30, 1000, 300),
      sample('/read', 2, 30, 1000, 300),
      sample('/read', 3, 30, 1000, 400),
    ]);

    expect(findings.map((found) => [found.route, found.isLeaking])).toEqual([
      ['/search', true],
      ['/read', true],
    ]);
  });

  it('judges each route on its own, in the order they were measured', () => {
    expect(
      judgeSweep([sample('/b', 2, 10), sample('/a', 2, 10), sample('/b', 1, 9)]).map(
        (found) => found.route,
      ),
    ).toEqual(['/b', '/a']);
  });
});
