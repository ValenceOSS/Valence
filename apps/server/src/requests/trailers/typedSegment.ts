const TRANSPORT_STREAM_SYNC = 0x47;

const ID3 = [0x49, 0x44, 0x33];

const ADTS_SYNC = 0xff;

const ADTS_SYNC_REST = 0xf0;

const ADTS_SYNC_MASK = 0xf6;

/**
 * Names what one piece of a trailer is from its first bytes, as YouTube does not: it calls every
 * piece `application/octet-stream`, its pictures MPEG-TS and its sound bare AAC, and a browser's
 * media engine that is not told the sound is bare AAC hands it to the browser as MP4, which never
 * gets past its first frame, so the picture never starts. The bytes are passed on untouched.
 *
 * @param body - The piece as YouTube sends it.
 * @param sentAs - What YouTube calls it, kept where its bytes say neither.
 * @returns The piece, and what it is.
 */
const typedSegment = async (
  body: ReadableStream<Uint8Array>,
  sentAs: string | null,
): Promise<{ body: ReadableStream<Uint8Array>; contentType: string }> => {
  const reader = body.getReader();
  const first = await reader.read();
  const head = first.done ? new Uint8Array() : first.value;
  const isPicture = head[0] === TRANSPORT_STREAM_SYNC;
  const isSound =
    ID3.every((byte, at) => head[at] === byte) ||
    (head[0] === ADTS_SYNC && ((head[1] ?? 0) & ADTS_SYNC_MASK) === ADTS_SYNC_REST);

  return {
    contentType: isPicture
      ? 'video/mp2t'
      : isSound
        ? 'audio/aac'
        : (sentAs ?? 'application/octet-stream'),
    body: new ReadableStream<Uint8Array>({
      start: (controller) => {
        if (head.byteLength > 0) {
          controller.enqueue(head);
        }

        if (first.done) {
          controller.close();
        }
      },
      pull: async (controller) => {
        const next = await reader.read();

        if (next.done) {
          controller.close();
        } else {
          controller.enqueue(next.value);
        }
      },
      cancel: (reason) => reader.cancel(reason),
    }),
  };
};

export { typedSegment };
