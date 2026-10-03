import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseArtwork } from './chooseArtwork';

const answering = (status: number, body: object) => {
  const fetching = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

  vi.stubGlobal('fetch', fetching);

  return fetching;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseArtwork', () => {
  it('puts the chosen picture', async () => {
    const fetching = answering(200, { jobId: null });
    const url = 'https://image.tmdb.org/t/p/original/p.jpg';

    expect(await chooseArtwork('film-1', 'poster', url)).toEqual({ jobId: null });
    expect(fetching).toHaveBeenCalledWith('/api/media/film-1/artwork/poster', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  });

  it('goes back to the catalogue’s pick with the job that restores it', async () => {
    const fetching = answering(200, { jobId: 'job-1' });

    expect(await chooseArtwork('film-1', 'logo', null)).toEqual({ jobId: 'job-1' });
    expect(fetching).toHaveBeenCalledWith('/api/media/film-1/artwork/logo', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });

  it('passes on why a picture was refused', async () => {
    answering(400, { error: 'That image isn’t one of the catalogue’s choices for this item.' });

    expect(
      await chooseArtwork('film-1', 'poster', 'https://image.tmdb.org/t/p/original/x.jpg'),
    ).toEqual({ problem: 'That image isn’t one of the catalogue’s choices for this item.' });
  });
});
