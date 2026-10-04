import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchArtworkChoices } from './fetchArtworkChoices';

const CHOICES = {
  kind: 'movie',
  options: {
    poster: [
      {
        url: 'https://image.tmdb.org/t/p/original/p.jpg',
        previewUrl: 'https://image.tmdb.org/t/p/w342/p.jpg',
        language: 'en',
        width: 1000,
        height: 1500,
        votes: 4,
      },
    ],
    backdrop: [],
    logo: [],
  },
  chosen: { poster: null, backdrop: null, logo: null },
};

const answering = (status: number, body: object) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchArtworkChoices', () => {
  it('reads what the catalogue has for the title', async () => {
    answering(200, CHOICES);

    expect(await fetchArtworkChoices('film-1')).toEqual(CHOICES);
    expect(fetch).toHaveBeenCalledWith('/api/media/film-1/artwork', { credentials: 'same-origin' });
  });

  it('passes on the server’s own words when it refuses', async () => {
    answering(404, { error: 'This isn’t matched to the catalogue yet. Fix the match first.' });

    expect(await fetchArtworkChoices('stray')).toEqual({
      problem: 'This isn’t matched to the catalogue yet. Fix the match first.',
    });
  });

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await fetchArtworkChoices('film-1')).toEqual({
      problem: 'Couldn’t reach the server.',
    });
  });
});
