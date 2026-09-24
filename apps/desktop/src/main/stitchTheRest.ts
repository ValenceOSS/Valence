const A_RANGE = /^bytes (\d+)-(\d+)\/(\d+)$/;

/**
 * Answers a request for the rest of a file with the rest of the file, fetched a slice at a time.
 *
 * A video element that asks for everything from a point on and is handed a slice takes the slice for
 * everything there is: behind this client's own scheme it never asks for the next one, plays to the
 * end of the slice, and stops as if the film had ended. So the element is told the truth, the whole
 * rest of the file with its real length, and the slices are stitched together behind it. Each slice
 * is read in full and checked against the range it claims before it is handed on, and the next is
 * only asked for once the element reads, so a video that has stopped reading holds no connection to
 * the server open.
 *
 * @param first - The server's answer to the first slice.
 * @param askFrom - Asks the server for the slice that starts at a byte.
 * @param letGo - What to do when the page stops reading.
 * @returns The whole rest of the file, or nothing where the first answer was not a slice short of
 *   the end, which is passed on as it came.
 */
const stitchTheRest = (
  first: Response,
  askFrom: (start: number) => Promise<Response>,
  letGo: () => void,
): Response | null => {
  const range =
    first.status === 206 ? A_RANGE.exec(first.headers.get('content-range') ?? '') : null;

  if (range === null) {
    return null;
  }

  const start = Number(range[1]);
  const total = Number(range[3]);
  let next = Number(range[2]) + 1;

  if (next >= total) {
    return null;
  }

  let answer: Response | null = first;
  let expected = { from: start, to: next - 1 };

  const body = new ReadableStream<Uint8Array>(
    {
      pull: async (controller) => {
        if (answer === null) {
          const asked = await askFrom(next);
          const got = A_RANGE.exec(asked.headers.get('content-range') ?? '');
          const from = Number(got?.[1]);
          const to = Number(got?.[2]);

          if (
            asked.status !== 206 ||
            got === null ||
            Number(got[3]) !== total ||
            from !== next ||
            to < from ||
            to >= total
          ) {
            controller.error(new Error('The server did not send the next part of the file.'));

            return;
          }

          answer = asked;
          expected = { from, to };
          next = to + 1;
        }

        const bytes = new Uint8Array(await answer.arrayBuffer());

        answer = null;

        if (bytes.byteLength !== expected.to - expected.from + 1) {
          controller.error(new Error('The server sent less of the file than it said.'));

          return;
        }

        controller.enqueue(bytes);

        if (next >= total) {
          controller.close();
        }
      },
      cancel: () => {
        letGo();
      },
    },
    { highWaterMark: 0 },
  );

  const headers = new Headers(first.headers);

  headers.delete('content-encoding');
  headers.set(
    'content-range',
    `bytes ${start.toString()}-${(total - 1).toString()}/${total.toString()}`,
  );
  headers.set('content-length', (total - start).toString());

  return new Response(body, { status: 206, statusText: first.statusText, headers });
};

export { stitchTheRest };
