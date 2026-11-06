import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

type AskedSegment = Pick<MediaSegment, 'kind' | 'startSeconds' | 'endSeconds'>;

/**
 * The markers to keep for a file once a person saves them: one left as it was found stays as it
 * was, with its own times and where it came from, so detection can still improve it; one added or
 * moved by more than the editor rounds to is a person's, and kept over every detection after.
 *
 * @param existing - The markers the file has.
 * @param asked - The markers saved, with times as the editor shows them, to the second.
 * @returns The markers to keep.
 */
const savedSegmentsOf = (
  existing: readonly MediaSegment[],
  asked: readonly AskedSegment[],
): MediaSegment[] => {
  const left = [...existing];

  return asked.map((segment) => {
    const at = left.findIndex(
      (one) =>
        one.kind === segment.kind &&
        Math.abs(one.startSeconds - segment.startSeconds) < 1 &&
        Math.abs(one.endSeconds - segment.endSeconds) < 1,
    );
    const [found] = at === -1 ? [] : left.splice(at, 1);

    return found ?? { ...segment, source: 'manual' };
  });
};

export { savedSegmentsOf };
