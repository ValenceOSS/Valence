import { describe, expect, it } from 'vitest';
import { createTroubleWatch } from './createTroubleWatch';

describe('createTroubleWatch', () => {
  it('hears of nothing from a read where nothing went wrong', async () => {
    const watch = createTroubleWatch();

    await expect(watch.during(() => Promise.resolve('found'))).resolves.toEqual({
      value: 'found',
      trouble: null,
    });
  });

  it('hears of trouble reported however deep in the read it was', async () => {
    const watch = createTroubleWatch();

    const deep = async () => {
      await Promise.resolve();
      watch.report({ source: 'TMDB', reason: 'rateLimited' });

      return null;
    };

    await expect(watch.during(async () => deep())).resolves.toEqual({
      value: null,
      trouble: { source: 'TMDB', reason: 'rateLimited' },
    });
  });

  it('keeps two reads running at once apart', async () => {
    const watch = createTroubleWatch();

    const [failing, fine] = await Promise.all([
      watch.during(async () => {
        await Promise.resolve();
        watch.report({ source: 'MusicBrainz', reason: 'unreachable' });
      }),
      watch.during(async () => {
        await Promise.resolve();
      }),
    ]);

    expect(failing.trouble).toEqual({ source: 'MusicBrainz', reason: 'unreachable' });
    expect(fine.trouble).toBeNull();
  });

  it('passes what a read inside another hears outwards', async () => {
    const watch = createTroubleWatch();

    const outer = await watch.during(async () =>
      watch.during(() => {
        watch.report({ source: 'Deezer', reason: 'faulty' });

        return Promise.resolve();
      }),
    );

    expect(outer.trouble).toEqual({ source: 'Deezer', reason: 'faulty' });
    expect(outer.value.trouble).toEqual({ source: 'Deezer', reason: 'faulty' });
  });

  it('keeps what a contained read hears to itself', async () => {
    const watch = createTroubleWatch();

    const outer = await watch.during(async () =>
      watch.contain(() => {
        watch.report({ source: 'Deezer', reason: 'faulty' });

        return Promise.resolve();
      }),
    );

    expect(outer.value.trouble).toEqual({ source: 'Deezer', reason: 'faulty' });
    expect(outer.trouble).toBeNull();
  });

  it('runs work outside every read, so it reports to none of them', async () => {
    const watch = createTroubleWatch();

    const { trouble } = await watch.during(() => {
      watch.outside(() => {
        watch.report({ source: 'TMDB', reason: 'faulty' });
      });

      return Promise.resolve();
    });

    expect(trouble).toBeNull();
  });

  it('keeps the first trouble it heard of', async () => {
    const watch = createTroubleWatch();

    const { trouble } = await watch.during(() => {
      watch.report({ source: 'TMDB', reason: 'keyRefused' });
      watch.report({ source: 'TMDB', reason: 'faulty' });

      return Promise.resolve();
    });

    expect(trouble).toEqual({ source: 'TMDB', reason: 'keyRefused' });
  });

  it('lets trouble reported with nobody watching go', () => {
    expect(() => {
      createTroubleWatch().report({ source: 'TMDB', reason: 'faulty' });
    }).not.toThrow();
  });
});
