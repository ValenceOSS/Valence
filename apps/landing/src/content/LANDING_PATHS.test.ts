import { describe, expect, it } from 'vitest';
import { buildRouter } from '@ValenceLanding/routes/buildRouter';
import { LANDING_PATHS } from './LANDING_PATHS';

describe('LANDING_PATHS', () => {
  it('names every page the router serves, and nothing it does not', () => {
    const served = Object.keys(buildRouter().routesByPath).filter(
      (path) => !path.includes('$') && path !== '/roadmap',
    );

    expect([...LANDING_PATHS].toSorted()).toEqual(served.toSorted());
  });
});
