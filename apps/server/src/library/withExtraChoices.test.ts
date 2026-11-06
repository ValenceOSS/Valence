import { describe, expect, it } from 'vitest';
import { NOT_AN_EPISODE } from './placement/NOT_AN_EPISODE';
import { withExtraChoices } from './withExtraChoices';
import type { Placement } from './placement/Placement.types';

const aPlacement = (extra: Placement['extra'] = null): Placement => ({
  isIgnored: false,
  title: 'A film',
  year: 2001,
  episode: NOT_AN_EPISODE,
  ids: { tmdb: null, imdb: null, tvdb: null },
  nfoPaths: [],
  extra,
  version: null,
});

describe('withExtraChoices', () => {
  it('makes a file an extra of the title chosen, and one the names took for an extra a film again', () => {
    const placed = new Map([
      ['/films/a/making of.mkv', aPlacement()],
      [
        '/films/a/trailer.mkv',
        aPlacement({ kind: 'trailer', parentPath: '/films/a/a.mkv', seriesFolder: null }),
      ],
    ]);
    const next = withExtraChoices(placed, [
      {
        path: '/films/a/making of.mkv',
        extraKind: 'behindTheScenes',
        parentPath: '/films/a/a.mkv',
      },
      { path: '/films/a/trailer.mkv', extraKind: null, parentPath: null },
      { path: '/films/gone.mkv', extraKind: 'clip', parentPath: null },
    ]);

    expect(next.get('/films/a/making of.mkv')?.extra).toEqual({
      kind: 'behindTheScenes',
      parentPath: '/films/a/a.mkv',
      seriesFolder: null,
    });
    expect(next.get('/films/a/trailer.mkv')?.extra).toBeNull();
    expect(next.has('/films/gone.mkv')).toBe(false);
  });
});
