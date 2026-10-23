import { describe, expect, it } from 'vitest';
import { placeEpisodes } from './placeEpisodes';
import { placedThroughDiscs } from './placedThroughDiscs';

describe('placedThroughDiscs', () => {
  it('hands each placement back under the real path of the stream it stood in for', () => {
    const stream = '/tv/Show/Season 1/Show S01E02/BDMV/STREAM/00001.m2ts';
    const placed = placedThroughDiscs(placeEpisodes, [stream], '/tv');

    expect([...placed.keys()]).toEqual([stream]);
    expect(placed.get(stream)?.episode.episodeNumber).toBe(2);
  });

  it('leaves files that are not on a disc where they are', () => {
    const path = '/tv/Show/Season 1/Show S01E04.mkv';

    expect(placedThroughDiscs(placeEpisodes, [path], '/tv')).toEqual(placeEpisodes([path], '/tv'));
  });

  it('points a version at the real path of the stream it is a version of', () => {
    const disc = '/tv/Show/Season 1/Show S01E02/BDMV/STREAM/00001.m2ts';
    const file = '/tv/Show/Season 1/Show S01E02 - 1080p.mkv';
    const placed = placedThroughDiscs(placeEpisodes, [disc, file], '/tv');
    const parents = [...placed.values()].flatMap((placement) =>
      placement.version === null ? [] : [placement.version.parentPath],
    );

    expect(parents).toHaveLength(1);
    expect([disc, file]).toContain(parents[0]);
    expect(placed.has('/tv/Show/Season 1/Show S01E02.m2ts')).toBe(false);
  });
});
