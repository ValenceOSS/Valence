import type { Narration } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which narration of a book to fetch without asking: the only one there is, or the one read by
 * whoever the library already has reading its series; nothing where that leaves a choice to make.
 *
 * @param narrations - The book's narrations.
 * @param seriesNarrators - Who reads the audiobooks of its series the library holds.
 * @returns The narration's ASIN, or null where somebody should choose.
 */
const narrationOfSeries = (
  narrations: readonly Narration[],
  seriesNarrators: readonly string[],
): string | null => {
  if (narrations.length === 1) {
    return narrations[0]?.asin ?? null;
  }

  const known = new Set(seriesNarrators.map((name) => name.toLowerCase()));
  const kept = narrations.filter((narration) =>
    narration.narrators.some((name) => known.has(name.toLowerCase())),
  );

  return kept.length === 1 ? (kept[0]?.asin ?? null) : null;
};

export { narrationOfSeries };
