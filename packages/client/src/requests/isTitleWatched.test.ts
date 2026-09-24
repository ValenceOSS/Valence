import { describe, expect, it } from 'vitest';
import { isTitleWatched } from './isTitleWatched';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const title = (overrides: Partial<CatalogueTitle> = {}): CatalogueTitle => ({
  kind: 'film',
  id: '603',
  title: 'The Matrix',
  subtitle: null,
  year: 1999,
  overview: null,
  posterUrl: null,
  standing: { status: 'library', mediaId: 'm1', requestId: null, requestState: null },
  ...overrides,
});

const finished = new Map([
  [
    'm1',
    {
      mediaId: 'm1',
      positionSeconds: 8160,
      durationSeconds: 8160,
      isFinished: true,
      updatedAt: '2026-09-24T00:00:00.000Z',
    },
  ],
]);

describe('isTitleWatched', () => {
  it('is watched where the film in the library has been finished', () => {
    expect(isTitleWatched(title(), finished)).toBe(true);
    expect(isTitleWatched(title(), new Map())).toBe(false);
  });

  it('is never watched where it is not in the library, or is a series', () => {
    expect(
      isTitleWatched(
        title({ standing: { status: 'askable', mediaId: null, requestId: null, requestState: null } }),
        finished,
      ),
    ).toBe(false);
    expect(isTitleWatched(title({ kind: 'series' }), finished)).toBe(false);
  });
});
