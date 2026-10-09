import { describe, expect, it } from 'vitest';
import { readEpisodes } from './readEpisodes';

describe('readEpisodes', () => {
  it('reads one episode, several, and a range', () => {
    expect(readEpisodes('Show S02E05 1080p')).toMatchObject({ seasons: [2], episodes: [5] });
    expect(readEpisodes('Show S01E01E02 1080p')).toMatchObject({ seasons: [1], episodes: [1, 2] });
    expect(readEpisodes('Show S01E01-E03 720p')).toMatchObject({ episodes: [1, 2, 3] });
    expect(readEpisodes('Show S01E01-03 720p')).toMatchObject({ episodes: [1, 2, 3] });
    expect(readEpisodes('Show S01E01 E02 E03')).toMatchObject({ episodes: [1, 2, 3] });
  });

  it('reads the older way of numbering', () => {
    expect(readEpisodes('The Simpsons 1x05 DVDRip')).toMatchObject({ seasons: [1], episodes: [5] });
    expect(readEpisodes('Movie 1920x1080').seasons).toEqual([]);
  });

  it('reads a whole season, and several', () => {
    expect(readEpisodes('The Bear S03 COMPLETE')).toMatchObject({ seasons: [3], episodes: [] });
    expect(readEpisodes('Show Season 2 1080p')).toMatchObject({ seasons: [2] });
    expect(readEpisodes('The Office US S01 S09')).toMatchObject({
      seasons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });
    expect(readEpisodes('Show S01-S03')).toMatchObject({ seasons: [1, 2, 3] });
    expect(readEpisodes('Game of Thrones Season 1-8 Complete')).toMatchObject({
      seasons: [1, 2, 3, 4, 5, 6, 7, 8],
    });
  });

  it('reads a daily show by its air date', () => {
    expect(readEpisodes('The Daily Show 2024 03 14 720p')).toMatchObject({ airDate: '2024-03-14' });
  });

  it('reads a complete series that names no seasons', () => {
    expect(readEpisodes('The Office (2005 2013) Complete Series 1080p')).toMatchObject({
      seasons: [],
      isCompleteSeries: true,
      absoluteEpisodes: [],
    });
  });

  it('reads anime numbering where a name numbers episodes without seasons', () => {
    expect(readEpisodes('[ASW] One Piece - 1100 [1080p]').absoluteEpisodes).toEqual([1100]);
    expect(readEpisodes('One Piece - 1100 - 1080p WEB').absoluteEpisodes).toEqual([1100]);
    expect(readEpisodes('[X] One Piece - E1100 Luffy 2160p').absoluteEpisodes).toEqual([1100]);
    expect(readEpisodes('[X] One Piece - 1100 & 1101 - [JPBD]').absoluteEpisodes).toEqual([
      1100, 1101,
    ]);
    expect(readEpisodes('[X] One Piece (Episode 1089-1092) (Dub)').absoluteEpisodes).toEqual([
      1089, 1090, 1091, 1092,
    ]);
    expect(readEpisodes('[X] One Piece 1100v2 [1080p]').absoluteEpisodes).toEqual([1100]);
  });

  it('takes no resolution, codec or film for an episode', () => {
    expect(readEpisodes('[X] Movie [1080p] [x265]').absoluteEpisodes).toEqual([]);
    expect(readEpisodes('[X] Show 1080-1090').absoluteEpisodes).toEqual([]);
    expect(readEpisodes('Oppenheimer 2023 1080p')).toMatchObject({
      seasons: [],
      episodes: [],
      absoluteEpisodes: [],
      airDate: null,
    });
    expect(readEpisodes('Movie - 2019 1080p').absoluteEpisodes).toEqual([]);
  });
});
