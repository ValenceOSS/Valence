import { describe, expect, it } from 'vitest';
import { movesBetween } from './movesBetween';

describe('movesBetween', () => {
  it('moves a film’s edits from its file to the entry it is matched to', () => {
    expect(
      movesBetween({ kind: 'film', film: 'file:/films/A.mkv' }, { kind: 'film', film: 'movie:1' }),
    ).toEqual([{ from: 'file:/films/A.mkv', to: 'movie:1', kind: 'film' }]);
  });

  it('leaves a film matched to another entry, or unchanged, where it is', () => {
    expect(
      movesBetween({ kind: 'film', film: 'movie:1' }, { kind: 'film', film: 'movie:2' }),
    ).toEqual([]);
    expect(
      movesBetween({ kind: 'film', film: 'movie:1' }, { kind: 'film', film: 'movie:1' }),
    ).toEqual([]);
  });

  it('moves a programme, its season and its episode once it is matched', () => {
    expect(
      movesBetween(
        {
          kind: 'episode',
          show: 'series:folder:Show',
          season: 'series:folder:Show:s1',
          episode: 'series:folder:Show:s1e2',
        },
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s1', episode: 'tv:9:e77' },
      ),
    ).toEqual([
      { from: 'series:folder:Show', to: 'tv:9', kind: 'show' },
      { from: 'series:folder:Show:s1', to: 'tv:9:s1', kind: 'season' },
      { from: 'series:folder:Show:s1e2', to: 'tv:9:e77', kind: 'episode' },
    ]);
  });

  it('moves an episode from its number to the catalogue’s own id for it', () => {
    expect(
      movesBetween(
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s1', episode: 'tv:9:s1e2' },
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s1', episode: 'tv:9:e77' },
      ),
    ).toEqual([{ from: 'tv:9:s1e2', to: 'tv:9:e77', kind: 'episode' }]);
  });

  it('moves an episode back to its number once it has lost the catalogue’s id for it', () => {
    expect(
      movesBetween(
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s7', episode: 'tv:9:e900' },
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s7', episode: 'tv:9:s7e2' },
      ),
    ).toEqual([{ from: 'tv:9:e900', to: 'tv:9:s7e2', kind: 'episode' }]);
  });

  it('leaves an episode of another programme, or a renumbered one, where it is', () => {
    expect(
      movesBetween(
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s1', episode: 'tv:9:e77' },
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s2', episode: 'tv:9:e78' },
      ),
    ).toEqual([]);
    expect(
      movesBetween(
        { kind: 'episode', show: 'tv:9', season: 'tv:9:s1', episode: 'tv:9:s1e2' },
        { kind: 'episode', show: 'tv:8', season: 'tv:8:s1', episode: 'tv:8:e5' },
      ),
    ).toEqual([]);
    expect(movesBetween({ kind: 'none' }, { kind: 'film', film: 'movie:1' })).toEqual([]);
  });
});
