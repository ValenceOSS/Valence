import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadArtwork } from './uploadArtwork';

const answering = (status: number, body: object) => {
  const fetching = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

  vi.stubGlobal('fetch', fetching);

  return fetching;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadArtwork', () => {
  it('puts the picture, saying what kind of image it is', async () => {
    const fetching = answering(200, { jobId: null });
    const picture = new Blob(['x'], { type: 'image/png' });

    expect(await uploadArtwork('film-1', 'backdrop', picture)).toEqual({ jobId: null });
    expect(fetching).toHaveBeenCalledWith('/api/media/film-1/artwork/backdrop/upload', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'image/png' },
      body: picture,
    });
  });

  it('passes on why a picture was turned away', async () => {
    answering(413, { error: 'That picture is too large.' });

    expect(await uploadArtwork('film-1', 'poster', new Blob(['x']))).toEqual({
      problem: 'That picture is too large.',
    });
  });

  it('says so when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect('problem' in (await uploadArtwork('film-1', 'poster', new Blob(['x'])))).toBe(true);
  });
});
