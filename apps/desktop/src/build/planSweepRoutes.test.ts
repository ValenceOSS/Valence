import { describe, expect, it } from 'vitest';
import { planSweepRoutes } from './planSweepRoutes';
import { SWEEP_ROUTES } from './SWEEP_ROUTES';

describe('planSweepRoutes', () => {
  it('adds the reader and the player where there is a book and a film', () => {
    expect(planSweepRoutes({ book: 'b1', film: 'f1' })).toEqual([
      ...SWEEP_ROUTES,
      '/read/b1',
      '/watch/f1',
    ]);
  });

  it('sweeps only the fixed pages where the server has neither', () => {
    expect(planSweepRoutes({ book: null, film: null })).toEqual([...SWEEP_ROUTES]);
  });
});
