import { describe, expect, it } from 'vitest';
import { findSayingWhy } from './findSayingWhy';
import { troubleWatch } from './troubleWatch';

describe('findSayingWhy', () => {
  it('hands back what was found', async () => {
    await expect(findSayingWhy(() => Promise.resolve(['a film']))).resolves.toEqual({
      found: ['a film'],
      refusal: null,
    });
  });

  it('finds nothing, plainly, where nothing went wrong', async () => {
    await expect(findSayingWhy(() => Promise.resolve([]))).resolves.toEqual({
      found: [],
      refusal: null,
    });
  });

  it('says why it found nothing where a site was failing', async () => {
    const { refusal } = await findSayingWhy(() => {
      troubleWatch.report({ source: 'TMDB', reason: 'rateLimited' });

      return Promise.resolve([]);
    });

    expect(refusal?.code).toBe('error.sources.sourceIsLimitingHowOften');
    expect(refusal?.values).toEqual({ source: 'TMDB' });
  });

  it('still answers with what it found while one site was failing', async () => {
    await expect(
      findSayingWhy(() => {
        troubleWatch.report({ source: 'Open Library', reason: 'unreachable' });

        return Promise.resolve(['a film']);
      }),
    ).resolves.toEqual({ found: ['a film'], refusal: null });
  });
});
