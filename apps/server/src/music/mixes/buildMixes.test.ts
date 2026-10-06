import { describe, expect, it } from 'vitest';
import { buildMixes } from './buildMixes';
import type { CatalogueSong } from '@ValenceServer/music/MusicService';

const DAY_MS = 86_400_000;

const NOW = 1_800_000_000_000;

const songsBy = (artist: string, genre: string, year: number, count: number): CatalogueSong[] =>
  Array.from({ length: count }, (_, at) => ({
    id: `${artist}-${at.toString()}`,
    albumId: `${artist}-album`,
    hasArtwork: true,
    year,
    genres: [genre],
    artists: [{ id: artist, name: artist.toUpperCase() }],
  }));

const SONGS = [
  ...songsBy('drake', 'Hip-Hop', 2018, 30),
  ...songsBy('kendrick', 'Hip-Hop', 2015, 30),
  ...songsBy('sleep', 'Metal', 2023, 25),
];

const build = (overrides: Partial<Parameters<typeof buildMixes>[0]> = {}) =>
  buildMixes({
    songs: SONGS,
    lately: [],
    overTheYear: [],
    liked: new Set(),
    nowMs: NOW,
    seed: 'profile:day',
    ...overrides,
  });

describe('buildMixes', () => {
  it('makes a mix for each genre and decade there is plenty of, with nothing heard yet', () => {
    const kinds = build().map((mix) => mix.id);

    expect(kinds).toEqual(
      expect.arrayContaining(['genre-hip-hop', 'genre-metal', 'decade-2010', 'decade-2020']),
    );
    expect(kinds.some((id) => id.startsWith('daily-'))).toBe(false);
  });

  it('keeps a mix in the same order for the day and changes it the next', () => {
    const today = build().find((mix) => mix.id === 'genre-hip-hop')?.trackIds;
    const again = build().find((mix) => mix.id === 'genre-hip-hop')?.trackIds;
    const tomorrow = build({ seed: 'profile:next-day' }).find(
      (mix) => mix.id === 'genre-hip-hop',
    )?.trackIds;

    expect(again).toEqual(today);
    expect(tomorrow).not.toEqual(today);
  });

  it('puts what has been played most this month on repeat', () => {
    const lately = ['drake-1', 'drake-2', 'drake-3', 'drake-4', 'drake-5'].map((trackId, at) => ({
      trackId,
      plays: 10 - at,
      lastPlayedAtMs: NOW - DAY_MS,
    }));

    const repeat = build({ lately }).find((mix) => mix.id === 'on-repeat');

    expect(repeat?.trackIds).toEqual(['drake-1', 'drake-2', 'drake-3', 'drake-4', 'drake-5']);
  });

  it('makes a daily mix of the artists played, with music like them not heard yet', () => {
    const lately = [{ trackId: 'drake-1', plays: 6, lastPlayedAtMs: NOW - DAY_MS }];

    const daily = build({ lately }).find((mix) => mix.id === 'daily-1');

    expect(daily?.detail).toBe('DRAKE');
    expect(daily?.trackIds.some((id) => id.startsWith('drake-'))).toBe(true);
    expect(daily?.trackIds.some((id) => id.startsWith('kendrick-'))).toBe(true);
    expect(daily?.trackIds.some((id) => id.startsWith('sleep-'))).toBe(false);
  });

  it('brings back what was played a lot and has gone quiet', () => {
    const overTheYear = ['sleep-1', 'sleep-2', 'sleep-3', 'sleep-4', 'sleep-5'].map((trackId) => ({
      trackId,
      plays: 4,
      lastPlayedAtMs: NOW - 120 * DAY_MS,
    }));

    expect(build({ overTheYear }).find((mix) => mix.id === 'rediscover')?.trackIds).toHaveLength(5);
  });

  it('leaves a list out rather than making it thin', () => {
    const lately = [{ trackId: 'drake-1', plays: 9, lastPlayedAtMs: NOW - DAY_MS }];

    expect(build({ lately }).some((mix) => mix.id === 'on-repeat')).toBe(false);
  });

  it('makes a cover only of the albums that have artwork', () => {
    const songs = [
      ...SONGS,
      ...songsBy('bare', 'Metal', 2023, 25).map((song) => ({ ...song, hasArtwork: false })),
    ];

    const covers = build({ songs }).flatMap((mix) => mix.coverAlbumIds);

    expect(covers).toContain('sleep-album');
    expect(covers).not.toContain('bare-album');
  });
});
