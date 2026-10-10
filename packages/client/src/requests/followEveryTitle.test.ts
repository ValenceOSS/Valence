import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { followEveryTitle } from './followEveryTitle';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';

const askForMedia = vi.hoisted(() =>
  vi.fn((asked: MediaRequestAsk) =>
    asked.tmdbId === 2
      ? Promise.resolve({ value: null, refusal: { message: 'No.' } })
      : asked.tmdbId === 3
        ? Promise.reject(new Error('unreadable'))
        : Promise.resolve({ value: { id: String(asked.tmdbId) }, refusal: null }),
  ),
);

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({ askForMedia }));

beforeEach(() => {
  askForMedia.mockClear();
});

const titled = (tmdbId: number) =>
  aCatalogueEntry({ key: `film:${tmdbId.toString()}`, catalogueId: tmdbId.toString() });

describe('followEveryTitle', () => {
  it('follows each title as followed, counting what could not be, and says how far it got', async () => {
    const progress: number[] = [];

    const { followed, failed } = await followEveryTitle([1, 2, 3, 4].map(titled), (done) => {
      progress.push(done);
    });

    expect(askForMedia).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'film', tmdbId: 1, origin: 'monitored' }),
    );
    expect(followed.map((request) => request.id).toSorted()).toEqual(['1', '4']);
    expect(failed).toBe(2);
    expect(progress).toEqual([1, 2, 3, 4]);
  });

  it('starts nothing more once told to stop', async () => {
    const { followed } = await followEveryTitle(
      [1, 4, 5, 6, 7, 8].map(titled),
      () => undefined,
      () => true,
    );

    expect(followed).toEqual([]);
    expect(askForMedia).not.toHaveBeenCalled();
  });

  it('follows nothing for nothing', async () => {
    expect(await followEveryTitle([], () => undefined)).toEqual({ followed: [], failed: 0 });
  });
});
