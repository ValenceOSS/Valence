import { describe, expect, it } from 'vitest';
import { radarrMovieOf } from './radarrMovieOf';
import { aSeerrRequest } from './testing/aSeerrRequest';

const ARRIVAL = { title: 'Arrival', year: 2016, overview: null, posterUrl: null };

const facts = {
  tmdbId: 329865,
  title: ARRIVAL,
  request: null,
  isHeld: false,
  qualityProfileId: 1,
  rootFolderPath: '/media/Films/',
};

describe('radarrMovieOf', () => {
  it('gives a film nobody asked for no id, unwatched and without its file', () => {
    const movie = radarrMovieOf(facts);

    expect(movie).not.toHaveProperty('id');
    expect(movie).toMatchObject({ monitored: false, hasFile: false, tags: [], year: 2016 });
  });

  it('keeps it in a folder of its own under the root folder', () => {
    expect(radarrMovieOf(facts)).toMatchObject({
      folderName: 'Arrival (2016)',
      path: '/media/Films/Arrival (2016)',
    });
  });

  it('watches a film once asking for it is approved, and gives it its file once filed', () => {
    expect(radarrMovieOf({ ...facts, request: aSeerrRequest() })).toMatchObject({
      id: 329865,
      monitored: true,
      hasFile: false,
    });
    expect(
      radarrMovieOf({ ...facts, request: aSeerrRequest({ state: 'available' }) }).hasFile,
    ).toBe(true);
  });

  it('does not watch a film whose request awaits approval', () => {
    expect(
      radarrMovieOf({ ...facts, request: aSeerrRequest({ approval: 'awaiting' }) }).monitored,
    ).toBe(false);
  });

  it('says a film in the library has its file whether or not anybody asked for it', () => {
    expect(radarrMovieOf({ ...facts, isHeld: true })).toMatchObject({
      id: 329865,
      hasFile: true,
      monitored: true,
    });
  });
});
