import type { ReviewSide } from '@ValenceContracts/schemas/Reencode';

const WIDTH = 960;

/**
 * Where to fetch one frame of either file being compared.
 *
 * Both sides come from the same address with the side named, rather than from two different ones,
 * because during a review the new encode is at the film own path and the original has been moved
 * aside — neither of them is somewhere a caller could name for itself, and neither should be.
 *
 * @param id - The re-encode being reviewed.
 * @param side - Which of the two files.
 * @param atSeconds - Where in the film to look.
 * @returns The address of the picture.
 */
const frameAt = (id: string, side: ReviewSide, atSeconds: number): string =>
  `/api/reencodes/${id}/frame?side=${side}&seconds=${Math.max(0, Math.floor(atSeconds)).toString()}&width=${WIDTH.toString()}`;

export { frameAt };
