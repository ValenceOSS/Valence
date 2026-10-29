import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPictureArea } from './readPictureArea';

afterEach(() => {
  vi.unstubAllGlobals();
});

const answering = (body: Record<string, string | number>, status = 200) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('readPictureArea', () => {
  it('reads where the picture sits inside the frame', async () => {
    const fetching = answering({ x: 0, y: 0.1278, width: 1, height: 0.7444 });

    vi.stubGlobal('fetch', fetching);

    await expect(readPictureArea('s-1')).resolves.toStrictEqual({
      x: 0,
      y: 0.1278,
      width: 1,
      height: 0.7444,
    });
    expect(fetching).toHaveBeenCalledWith('/api/playback/session/s-1/picture.json');
  });

  it('answers with nothing until the server has worked it out', async () => {
    vi.stubGlobal('fetch', answering({ error: 'No such segment.' }, 404));

    await expect(readPictureArea('s-1')).resolves.toBeNull();
  });

  it('refuses an area that runs outside the frame', async () => {
    vi.stubGlobal('fetch', answering({ x: 0.5, y: 0, width: 0.8, height: 1 }));

    await expect(readPictureArea('s-1')).resolves.toBeNull();
  });

  it('answers with nothing where the server could not be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));

    await expect(readPictureArea('s-1')).resolves.toBeNull();
  });
});
