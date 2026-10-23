import { describe, expect, it } from 'vitest';
import { placeInLibrary } from './placeInLibrary';

describe('placeInLibrary', () => {
  it('reads every file of a films library as a film, however it is named', () => {
    const path = '/movies/Some.Film.S01E01.mkv';

    expect(placeInLibrary('movies', [path], '/movies').get(path)?.episode.episodeNumber).toBeNull();
  });

  it('reads every file of a programmes library as an episode', () => {
    const path = '/tv/Show/Season 1/Show - Pilot.mkv';

    expect(placeInLibrary('shows', [path], '/tv').get(path)?.episode.seriesFolder).toBe('/tv/Show');
  });

  it('reads which episode a Blu-ray copied whole is from the folder holding it', () => {
    const second = '/tv/Show/Season 1/Show S01E02/BDMV/STREAM/00001.m2ts';
    const third = '/tv/Show/Season 1/Show S01E03/BDMV/STREAM/00001.m2ts';
    const placed = placeInLibrary('shows', [second, third], '/tv');

    expect(placed.get(second)?.episode).toMatchObject({ seasonNumber: 1, episodeNumber: 2 });
    expect(placed.get(third)?.episode).toMatchObject({ seasonNumber: 1, episodeNumber: 3 });
    expect(placed.get(third)?.version).toBeNull();
  });

  it('reads a film beside the shows of an anime library as a film', () => {
    const path = '/anime/Show the Film (2022)/Show the Film (2022).mkv';

    expect(placeInLibrary('anime', [path], '/anime').get(path)?.episode.seriesFolder).toBeNull();
  });
});
