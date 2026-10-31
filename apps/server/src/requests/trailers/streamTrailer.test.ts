import { describe, expect, it, vi } from 'vitest';
import { streamTrailer } from './streamTrailer';

const PIECE = 10 * 1024 * 1024;

/**
 * A YouTube that serves a picture of the given size in whatever range its address asks for, and
 * counts what it was asked.
 *
 * @param size - How large the picture is.
 * @returns Where it is, the fetch it answers, and the ranges it was asked for.
 */
const aYouTube = (size: number) => {
  const asked: string[] = [];
  const fetchPiece = vi.fn<typeof fetch>((input) => {
    const address = input instanceof Request ? input.url : input.toString();
    const range = new URL(address).searchParams.get('range') ?? '';
    const [from = 0, to = 0] = range.split('-').map(Number);

    asked.push(range);

    return Promise.resolve(
      new Response(new Uint8Array(Math.min(to, size - 1) - from + 1), {
        status: 200,
        headers: { 'content-type': 'video/mp4' },
      }),
    );
  });

  return {
    url: `https://rr1.googlevideo.com/videoplayback?id=1&clen=${size.toString()}`,
    asked,
    fetchPiece,
  };
};

describe('streamTrailer', () => {
  it('answers a range as asked, with how large the whole picture is', async () => {
    const { url, asked, fetchPiece } = aYouTube(5000);
    const file = await streamTrailer(url, 'bytes=0-1', fetchPiece);

    expect(asked).toEqual(['0-1']);
    expect(file?.status).toBe(206);
    expect(file?.contentRange).toBe('bytes 0-1/5000');
    expect(file?.contentLength).toBe('2');
  });

  it('fetches a long range ten megabytes at a time, and sends it on whole', async () => {
    const size = PIECE * 2 + 100;
    const { url, asked, fetchPiece } = aYouTube(size);
    const file = await streamTrailer(url, 'bytes=0-', fetchPiece);
    const sent = await new Response(file?.body).arrayBuffer();

    expect(sent.byteLength).toBe(size);
    expect(asked).toHaveLength(3);
    expect(file?.contentRange).toBe(`bytes 0-${(size - 1).toString()}/${size.toString()}`);
  });

  it('sends the whole picture to somebody who asked for no range', async () => {
    const { url, fetchPiece } = aYouTube(5000);
    const file = await streamTrailer(url, null, fetchPiece);

    expect(file?.status).toBe(200);
    expect(file?.contentRange).toBeNull();
    expect(file?.contentLength).toBe('5000');
  });

  it('answers nothing where YouTube will no longer serve the address', async () => {
    const fetchPiece = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('', { status: 403 })),
    );

    expect(await streamTrailer('https://yt/v?clen=5000', 'bytes=0-1', fetchPiece)).toBeNull();
  });

  it('answers nothing where the address does not say how large the picture is', async () => {
    const fetchPiece = vi.fn<typeof fetch>();

    expect(await streamTrailer('https://yt/v?id=1', 'bytes=0-1', fetchPiece)).toBeNull();
    expect(fetchPiece).not.toHaveBeenCalled();
  });
});
