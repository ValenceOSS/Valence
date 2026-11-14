const MOST_BYTES = 64 * 1024 * 1024;

/**
 * Another server's answer, ready to be read whole, that stops being read once it is longer than any
 * answer this server reads whole should be: a catalogue page, a picture or a list. A server that
 * answers forever, or with more than it should, fails the read rather than filling this server's
 * memory. What is passed through to somebody watching is never read this way, so a film is not cut
 * short.
 *
 * @param answered - The answer.
 * @param mostBytes - The most it may hold.
 * @returns The same answer, held to that.
 */
const boundedAnswer = (answered: Response, mostBytes: number = MOST_BYTES): Response => {
  if (answered.body === null) {
    return answered;
  }

  const declared = Number(answered.headers.get('content-length') ?? '0');
  let held = 0;
  const counted = answered.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      start: (controller) => {
        if (declared > mostBytes) {
          controller.error(new Error('the other server answered with more than it should'));
        }
      },
      transform: (chunk, controller) => {
        held += chunk.byteLength;

        if (held > mostBytes) {
          controller.error(new Error('the other server answered with more than it should'));

          return;
        }

        controller.enqueue(chunk);
      },
    }),
  );

  return new Response(counted, {
    status: answered.status,
    statusText: answered.statusText,
    headers: answered.headers,
  });
};

export { boundedAnswer };
