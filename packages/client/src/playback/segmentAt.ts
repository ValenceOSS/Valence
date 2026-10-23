import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

/**
 * Finds the marked stretch a moment falls in — the intro, a recap, the credits — so whatever is
 * pointing at that moment can say what it is.
 *
 * @param segments - The item's marked stretches.
 * @param seconds - The moment.
 * @returns The stretch it falls in, or null where it falls in none.
 */
const segmentAt = (segments: readonly MediaSegment[], seconds: number): MediaSegment | null =>
  segments.find((segment) => seconds >= segment.startSeconds && seconds < segment.endSeconds) ??
  null;

export { segmentAt };
