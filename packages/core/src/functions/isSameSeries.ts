import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Decides whether two episodes belong to the same programme: by the programme itself where both
 * know which it is, so two programmes that share a name stay apart, and by its name where either
 * arrived knowing only that.
 *
 * @param left - One episode.
 * @param right - The other.
 * @returns Whether they are of the same programme, which neither is where it names none.
 */
const isSameSeries = (
  left: Pick<MediaSummary, 'seriesId' | 'seriesTitle'>,
  right: Pick<MediaSummary, 'seriesId' | 'seriesTitle'>,
): boolean => {
  if (left.seriesId !== null && right.seriesId !== null) {
    return left.seriesId === right.seriesId;
  }

  const name = left.seriesTitle ?? null;

  return name !== null && name === (right.seriesTitle ?? null);
};

export { isSameSeries };
