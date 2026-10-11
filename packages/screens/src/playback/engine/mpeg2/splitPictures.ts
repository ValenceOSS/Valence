const PICTURE = 0x00;

const SEQUENCE_HEADER = 0xb3;

const GROUP = 0xb8;

const BOUNDARIES: ReadonlySet<number> = new Set([PICTURE, SEQUENCE_HEADER, GROUP]);

type Unit = {
  start: number;
  end: number;
  isPicture: boolean;
  isSequenceHeader: boolean;
  isBidirectional: boolean;
};

/**
 * An MPEG-2 elementary stream cut into its sequence headers, group headers and pictures — each with
 * the extensions, user data and slices that follow it, which belong to it — and whether a picture
 * is a B-picture, which only a decoder that has the reference pictures either side of it can decode.
 *
 * @param stream - The stream.
 * @returns Its units, in order.
 */
const splitPictures = (stream: Uint8Array): Unit[] => {
  const starts: number[] = [];

  for (let at = 0; at + 3 < stream.length; at += 1) {
    if (stream[at] === 0 && stream[at + 1] === 0 && stream[at + 2] === 1) {
      if (BOUNDARIES.has(stream[at + 3] ?? -1)) {
        starts.push(at);
      }

      at += 3;
    }
  }

  return starts.map((start, index) => {
    const code = stream[start + 3] ?? -1;

    return {
      start,
      end: starts[index + 1] ?? stream.length,
      isPicture: code === PICTURE,
      isSequenceHeader: code === SEQUENCE_HEADER,
      isBidirectional: code === PICTURE && (((stream[start + 5] ?? 0) >> 3) & 7) === 3,
    };
  });
};

export type { Unit };

export { splitPictures };
