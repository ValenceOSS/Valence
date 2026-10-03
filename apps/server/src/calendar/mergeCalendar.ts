import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Puts a library's episodes and the requested ones on one calendar, an episode that is both once.
 *
 * The library's entry is kept, since it opens the show as held and draws its artwork. Where the
 * library does not hold it yet, the request knows more, so its state and who asked are taken from
 * the request: an episode the library calls not held may be downloading.
 *
 * @param library - The library's entries.
 * @param requests - The requests' entries.
 * @returns Every entry once, in the order the days fall, then by title, season and episode.
 */
const mergeCalendar = (
  library: readonly CalendarEntry[],
  requests: readonly CalendarEntry[],
): CalendarEntry[] => {
  const asked = new Map<string, CalendarEntry>();

  for (const entry of requests) {
    if (!asked.has(entry.id)) {
      asked.set(entry.id, entry);
    }
  }

  const merged = library.map((entry) => {
    const request = asked.get(entry.id);

    if (request === undefined) {
      return entry;
    }

    asked.delete(entry.id);

    return {
      ...entry,
      state: entry.state === 'available' ? entry.state : request.state,
      requestedBy: request.requestedBy,
    };
  });

  return [...merged, ...asked.values()].sort(
    (one, other) =>
      one.date.localeCompare(other.date) ||
      one.title.localeCompare(other.title) ||
      (one.episode?.seasonNumber ?? 0) - (other.episode?.seasonNumber ?? 0) ||
      (one.episode?.episodeNumber ?? 0) - (other.episode?.episodeNumber ?? 0),
  );
};

export { mergeCalendar };
