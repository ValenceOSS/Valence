import { describe, expect, it, vi } from 'vitest';
import { streamTrailer } from './streamTrailer';

const PIECE = 10 * 1024 * 1024;

/**
 * A YouTube that serves a picture of the given size in whatever range it is asked for, and counts
 * what it was asked.
 *
 * @param size - How large the picture is.
 * @returns The fetch it answers, and the ranges it was asked for.
 */
const aYouTube = (size: number) => {
  const asked: string[] = [];
  const fetchPiece = vi.fn<typeof fetch>((_url, init) => {
    const range = new Headers(init?.headers).get('range') ?? '';
    const [, from = '0', to = '0'] = /bytes=(\d+)-(\d+)/u.exec(range) ?? [];
    const end = Math.min(Number(to), size - 1);

    asked.push(range);

    return Promise.resolve(
      new Response(new Uint8Array(end - Number(from) + 1), {
        status: 206,
        headers: {
          'content-type': 'video/mp4',
          'content-range': `bytes ${from}-${end.toString()}/${size.toString()}`,
        },
      }),
    );
  });

  return { asked, fetchPiece };
};

describe('streamTrailer', () => {
  it('answers a range as asked, with what it is a part of', async () => {
    const { fetchPiece } = aYouTube(5000);
    const file = await streamTrailer('https://yt/v', 'bytes=0-1', fetchPiece);

    expect(file?.status).toBe(206);
    expect(file?.contentRange).toBe('bytes 0-1/5000');
    expect(file?.contentLength).toBe('2');
  });

  it('fetches a long range ten megabytes at a time, and sends it on whole', async () => {
    const size = PIECE * 2 + 100;
    const { asked, fetchPiece } = aYouTube(size);
    const file = await streamTrailer('https://yt/v', 'bytes=0-', fetchPiece);
    const sent = await new Response(file?.body).arrayBuffer();

    expect(sent.byteLength).toBe(size);
    expect(asked).toHaveLength(3);
    expect(file?.contentRange).toBe(`bytes 0-${(size - 1).toString()}/${size.toString()}`);
  });

  it('sends the whole picture to somebody who asked for no range', async () => {
    const { fetchPiece } = aYouTube(5000);
    const file = await streamTrailer('https://yt/v', null, fetchPiece);

    expect(file?.status).toBe(200);
    expect(file?.contentRange).toBeNull();
    expect(file?.contentLength).toBe('5000');
  });

  it('answers nothing where YouTube will no longer serve the address', async () => {
    const fetchPiece = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('', { status: 403 })),
    );

    expect(await streamTrailer('https://yt/v', 'bytes=0-1', fetchPiece)).toBeNull();
  });
});
