import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const FRESH_FOR_MS = 14 * 24 * 60 * 60 * 1000;

const MOST_FLAGGED = 6;

type Flagged = Pick<MediaSummary, 'id' | 'addedAt' | 'seriesId' | 'seriesTitle'>;

/**
 * What stands for a title across the library: a programme by its series, however many of its
 * episodes there are, and a film by itself.
 *
 * @param media - The title, or one of a programme's episodes.
 * @returns What it is known by.
 */
const keyOf = (media: Flagged): string =>
  media.seriesId ??
  (media.seriesTitle === null || media.seriesTitle === undefined
    ? media.id
    : `series:${media.seriesTitle}`);

/**
 * Decides which titles carry a flag for being new, measured against the rest of the library rather
 * than the calendar alone — a library filled in one go would otherwise flag everything in it.
 *
 * Only the few titles that arrived most recently are flagged, and only within the last two weeks.
 * A programme that was already there before its latest episode arrived has a new episode; one that
 * arrived whole was recently added, as a film is.
 *
 * @param library - Everything in the library that could be on a card.
 * @param now - The time now, in milliseconds.
 * @returns What a title's flag says, or nothing where it has none.
 */
const freshFlags = (
  library: readonly Flagged[],
  now: number,
): ((media: Flagged) => string | null) => {
  const newest = new Map<string, number>();
  const oldest = new Map<string, number>();

  for (const media of library) {
    const added = Date.parse(media.addedAt);

    if (Number.isNaN(added)) {
      continue;
    }

    const key = keyOf(media);

    newest.set(key, Math.max(newest.get(key) ?? added, added));
    oldest.set(key, Math.min(oldest.get(key) ?? added, added));
  }

  const flags = new Map<string, string>(
    [...newest.entries()]
      .filter(([, added]) => now - added <= FRESH_FOR_MS)
      .sort(([, left], [, right]) => right - left)
      .slice(0, MOST_FLAGGED)
      .map(([key]) => [
        key,
        now - (oldest.get(key) ?? 0) > FRESH_FOR_MS
          ? say('client.library.freshFlags.newEpisode')
          : say('common.recentlyAdded'),
      ]),
  );

  return (media) => flags.get(keyOf(media)) ?? null;
};

export { freshFlags };
