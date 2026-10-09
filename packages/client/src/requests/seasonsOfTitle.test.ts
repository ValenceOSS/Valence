import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { seasonsOfTitle } from './seasonsOfTitle';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * An episode file the library holds.
 *
 * @param season - Its season.
 * @param episode - Its number.
 * @param lastEpisode - The last number it spans, for a double episode.
 * @returns The file.
 */
const aFile = (season: number, episode: number, lastEpisode: number | null = null): TitleFile => ({
  mediaId: `m-${season.toString()}-${episode.toString()}`,
  path: `/media/Show/Season ${season.toString()}/${episode.toString()}.mkv`,
  season,
  episode,
  lastEpisode,
  sizeBytes: null,
  height: null,
  videoCodec: null,
  addedAt: null,
});

describe('seasonsOfTitle', () => {
  it('lists each season the catalogue, the library or the request knows, specials first', () => {
    const seasons = seasonsOfTitle(
      null,
      [aFile(2, 1)],
      [
        { season: 1, episodeCount: 2, firstAired: null, standing: 'askable' },
        { season: 0, episodeCount: 1, firstAired: null, standing: 'askable' },
      ],
    );

    expect(seasons.map((one) => [one.season, one.episodes.length])).toEqual([
      [0, 1],
      [1, 2],
      [2, 1],
    ]);
    expect(seasons[2]?.episodes[0]?.part).toBe('library');
    expect(seasons[2]?.episodes[0]?.path).toBeTypeOf('string');
    expect(seasons[1]?.episodes[0]).toMatchObject({ part: 'notAsked', path: null });
  });

  it('says where each episode asked for stands, and whether its season is followed', () => {
    const request = aMediaRequest({
      kind: 'series',
      items: [
        aRequestItem({ id: 'a', season: 1, episode: 1, state: 'downloading', title: 'One' }),
        aRequestItem({ id: 'b', season: 1, episode: 2, state: 'wanted', isFollowed: false }),
      ],
    });
    const [season] = seasonsOfTitle(request, [], []);

    expect(season).toMatchObject({ season: 1, isAsked: true, isFollowed: true });
    expect(season?.episodes).toMatchObject([
      { episode: 1, title: 'One', part: 'downloading', itemId: 'a' },
      { episode: 2, part: 'notFollowed', itemId: 'b' },
    ]);
  });

  it('counts a double episode as both, with its one file', () => {
    const [season] = seasonsOfTitle(null, [aFile(1, 1, 2)], []);

    expect(season?.episodes.map((one) => one.path)).toEqual([
      '/media/Show/Season 1/1.mkv',
      '/media/Show/Season 1/1.mkv',
    ]);
  });
});
