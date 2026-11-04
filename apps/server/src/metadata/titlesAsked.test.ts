import { describe, expect, it } from 'vitest';
import { aListedFile } from '@ValenceServer/testing/aListedFile';
import { listedTitlesOf } from './listedTitlesOf';
import type { TitleListQuery } from '@ValenceContracts/schemas/TitleList';
import { titlesAsked } from './titlesAsked';

const NOW = Date.parse('2026-02-01T00:00:00.000Z');

const titles = listedTitlesOf(
  [
    aListedFile('heat', {
      tags: ['heist'],
      certification: '15',
      summary: { title: 'Heat', year: 1995, genres: ['Crime'] },
    }),
    aListedFile('alien', {
      hasOverview: false,
      hasSubtitles: true,
      summary: {
        title: 'Alien',
        year: 1979,
        width: 3840,
        height: 2160,
        videoCodec: 'hevc',
        videoRange: 'HDR10',
        addedAt: '2026-01-30T00:00:00.000Z',
        hasPoster: false,
      },
    }),
  ],
  { duplicates: new Map(), duplicatePaths: new Map(), editedKeys: new Set(['movie:603']) },
);

const ASKED: TitleListQuery = {
  libraryId: 'lib',
  sort: 'title',
  desc: false,
  show: 'all',
  filter: [],
};

/**
 * The names of the titles a listing shows.
 *
 * @param change - What the listing asks beyond every title by name.
 * @returns The names, in order.
 */
const namesOf = (change: Partial<TitleListQuery>) =>
  titlesAsked(titles, { ...ASKED, ...change }, NOW).shown.map((one) => one.row.name);

describe('titlesAsked', () => {
  it('puts the titles in the order asked, either way', () => {
    expect(namesOf({})).toEqual(['Alien', 'Heat']);
    expect(namesOf({ sort: 'year', desc: true })).toEqual(['Heat', 'Alien']);
  });

  it('searches the title, its sort title and its files', () => {
    expect(namesOf({ search: 'heat.mkv' })).toEqual(['Heat']);
  });

  it('narrows by each kind of chip, any value of one kind and every kind together', () => {
    expect(namesOf({ filter: ['missing:overview'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['missing:poster'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['resolution:4K'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['range:HDR10'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['codec:hevc'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['genre:Crime'] })).toEqual(['Heat']);
    expect(namesOf({ filter: ['tag:heist'] })).toEqual(['Heat']);
    expect(namesOf({ filter: ['year:1990-1999'] })).toEqual(['Heat']);
    expect(namesOf({ filter: ['rating:15'] })).toEqual(['Heat']);
    expect(namesOf({ filter: ['added:7'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['subtitles:yes'] })).toEqual(['Alien']);
    expect(namesOf({ filter: ['genre:Crime', 'codec:hevc'] })).toEqual([]);
    expect(namesOf({ filter: ['codec:hevc', 'codec:h264'] })).toEqual(['Alien', 'Heat']);
  });

  it('shows what a quick filter asks for, and counts each of what the search left', () => {
    const asked = titlesAsked(titles, { ...ASKED, show: 'look' }, NOW);

    expect(asked.shown.map((one) => one.row.name)).toEqual(['Alien']);
    expect(asked.counts).toEqual({ all: 2, look: 1, twice: 0, unreadable: 0, edited: 2 });
  });

  it('ignores a chip it cannot read', () => {
    expect(namesOf({ filter: ['nonsense', 'colour:blue'] })).toEqual(['Alien', 'Heat']);
  });
});
