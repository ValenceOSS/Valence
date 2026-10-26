import { describe, expect, it } from 'vitest';
import { reportStatus } from './reportStatus';
import { troubleWatch } from './troubleWatch';

describe('reportStatus', () => {
  it('reports a status that means trouble, naming the site', async () => {
    const { trouble } = await troubleWatch.during(() => {
      reportStatus('https://api.deezer.com/chart', 500);

      return Promise.resolve();
    });

    expect(trouble).toEqual({ source: 'Deezer', reason: 'faulty' });
  });

  it('reports nothing for a site that only has nothing', async () => {
    const { trouble } = await troubleWatch.during(() => {
      reportStatus('https://api.deezer.com/chart', 404);

      return Promise.resolve();
    });

    expect(trouble).toBeNull();
  });
});
