import { describe, expect, it } from 'vitest';
import { reportingTrouble } from './reportingTrouble';
import { troubleWatch } from './troubleWatch';

describe('reportingTrouble', () => {
  it('hands the answer back and reports nothing where the site answered', async () => {
    const ask = reportingTrouble(() => Promise.resolve(Response.json({ found: true })));

    const { value, trouble } = await troubleWatch.during(() => ask('https://itunes.apple.com/x'));

    expect(value.status).toBe(200);
    expect(trouble).toBeNull();
  });

  it('reports a site that answered with trouble, naming it', async () => {
    const ask = reportingTrouble(() => Promise.resolve(new Response(null, { status: 429 })));

    const { trouble } = await troubleWatch.during(() => ask('https://itunes.apple.com/x'));

    expect(trouble).toEqual({ source: 'Apple Music', reason: 'rateLimited' });
  });

  it('reports a site it could not reach, and still fails as it would have', async () => {
    const ask = reportingTrouble(() => Promise.reject(new Error('offline')));

    const { value, trouble } = await troubleWatch.during(() =>
      ask('https://api.mangadex.org/x').catch((error: Error) => error.message),
    );

    expect(value).toBe('offline');
    expect(trouble).toEqual({ source: 'MangaDex', reason: 'unreachable' });
  });
});
