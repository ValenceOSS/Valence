import type { PreviewRead } from '@ValenceServer/playback/PlaybackService';

type RangedFile = Extract<PreviewRead, { kind: 'ready' }>['file'];

const PIECE = 10 * 1024 * 1024;

const ASKED = /^bytes=(\d+)-(\d*)$/u;

const WHOLE = /\/(\d+)$/u;

/**
 * Streams a trailer's picture from YouTube to whoever asked, in the byte range they asked for.
 *
 * YouTube slows or refuses a request for much more than ten megabytes at once, and a player asks
 * for everything from where it is to the end, so the range is fetched ten megabytes at a time, one
 * piece after another as the player reads, and sent on as one answer. A range in any other form
 * than from-to is answered with the whole picture, as a server that ignores ranges would.
 *
 * @param url - Where YouTube serves the picture.
 * @param range - The range asked for, or nothing for all of it.
 * @param fetchPiece - How to fetch a piece, for tests.
 * @returns The picture, or nothing where YouTube would not serve it, as it will not once the
 *   address has expired.
 */
const streamTrailer = async (
  url: string,
  range: string | null,
  fetchPiece: typeof fetch = fetch,
): Promise<RangedFile | null> => {
  const asked = range === null ? null : ASKED.exec(range.trim());
  const from = asked === null ? 0 : Number(asked[1]);
  const askedTo = asked === null || asked[2] === '' ? null : Number(asked[2]);
  const piece = (start: number, end: number) =>
    fetchPiece(url, { headers: { Range: `bytes=${start.toString()}-${end.toString()}` } }).catch(
      () => null,
    );
  const firstEnd = Math.min(askedTo ?? Number.POSITIVE_INFINITY, from + PIECE - 1);
  const first = await piece(from, firstEnd);

  if (first === null || first.status !== 206 || first.body === null) {
    await first?.body?.cancel();

    return null;
  }

  const whole = Number(WHOLE.exec(first.headers.get('content-range') ?? '')?.[1]);

  if (!Number.isFinite(whole) || whole <= from) {
    await first.body.cancel();

    return null;
  }

  const to = Math.min(askedTo ?? whole - 1, whole - 1);
  let reader: ReadableStreamDefaultReader<Uint8Array> = first.body.getReader();
  let next = firstEnd + 1;

  const body = new ReadableStream<Uint8Array>({
    pull: async (controller) => {
      for (;;) {
        const read = await reader.read();

        if (!read.done) {
          controller.enqueue(read.value);

          return;
        }

        if (next > to) {
          controller.close();

          return;
        }

        const end = Math.min(next + PIECE - 1, to);
        const more = await piece(next, end);

        if (more === null || more.status !== 206 || more.body === null) {
          controller.error(new Error('YouTube stopped serving the trailer part way through'));

          return;
        }

        next = end + 1;
        reader = more.body.getReader();
      }
    },
    cancel: async () => {
      await reader.cancel();
    },
  });

  return {
    body,
    contentType: first.headers.get('content-type') ?? 'video/mp4',
    status: asked === null ? 200 : 206,
    contentRange:
      asked === null ? null : `bytes ${from.toString()}-${to.toString()}/${whole.toString()}`,
    contentLength: (to - from + 1).toString(),
  };
};

export { streamTrailer };
