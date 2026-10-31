import type { PreviewRead } from '@ValenceServer/playback/PlaybackService';

type RangedFile = Extract<PreviewRead, { kind: 'ready' }>['file'];

const PIECE = 10 * 1024 * 1024;

const ASKED = /^bytes=(\d+)-(\d*)$/u;

/**
 * Streams a trailer's picture from YouTube to whoever asked, in the byte range they asked for.
 *
 * YouTube refuses a range asked for in a Range header, and serves one written into the address
 * instead, as yt-dlp asks for it, without saying how large the whole picture is; the address
 * itself says, as its `clen`. It slows or refuses much more than ten megabytes at once, and a
 * player asks for everything from where it is to the end, so the range is fetched ten megabytes at
 * a time, one piece after another as the player reads, and sent on as one answer with the length
 * of the whole. A range in any other form than from-to is answered with the whole picture, as a
 * server that ignores ranges would.
 *
 * @param url - Where YouTube serves the picture.
 * @param range - The range asked for, or nothing for all of it.
 * @param fetchPiece - How to fetch a piece, for tests.
 * @returns The picture, or nothing where YouTube would not serve it, as it will not once the
 *   address has expired, or where the address does not say how large it is.
 */
const streamTrailer = async (
  url: string,
  range: string | null,
  fetchPiece: typeof fetch = fetch,
): Promise<RangedFile | null> => {
  const whole = Number(new URL(url).searchParams.get('clen'));
  const asked = range === null ? null : ASKED.exec(range.trim());
  const from = asked === null ? 0 : Number(asked[1]);
  const to = Math.min(asked === null || asked[2] === '' ? whole - 1 : Number(asked[2]), whole - 1);

  if (!Number.isInteger(whole) || whole <= 0 || from > to) {
    return null;
  }

  const piece = async (start: number) => {
    const end = Math.min(start + PIECE - 1, to);
    const answer = await fetchPiece(`${url}&range=${start.toString()}-${end.toString()}`).catch(
      () => null,
    );

    if (answer === null || !answer.ok || answer.body === null) {
      await answer?.body?.cancel();

      return null;
    }

    return { end, answer, body: answer.body };
  };
  const first = await piece(from);

  if (first === null) {
    return null;
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> = first.body.getReader();
  let next = first.end + 1;

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

        const more = await piece(next);

        if (more === null) {
          controller.error(new Error('YouTube stopped serving the trailer part way through'));

          return;
        }

        next = more.end + 1;
        reader = more.body.getReader();
      }
    },
    cancel: async () => {
      await reader.cancel();
    },
  });

  return {
    body,
    contentType: first.answer.headers.get('content-type') ?? 'video/mp4',
    status: asked === null ? 200 : 206,
    contentRange:
      asked === null ? null : `bytes ${from.toString()}-${to.toString()}/${whole.toString()}`,
    contentLength: (to - from + 1).toString(),
  };
};

export { streamTrailer };
