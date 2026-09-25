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
});
