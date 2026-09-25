import type { AdminOverview, Monitor } from '@ValenceClient/admin/fetchAdmin';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

type CacheRow = {
  label: string;
  value: string;
  detail: string;
  hint?: string;
  hintLabel?: string;
};

/**
 * Builds the rows of the disk breakdown, one per kind of thing Valence keeps, each with its size and how
 * many of it there are. Anything not yet counted is shown as still counting rather than as zero —
 * zero is a claim, and the wrong one while a count is in progress.
 *
 * @param cache - What the monitor found on disk, or null while it is still counting.
 * @param artwork - How much artwork has been fetched and kept.
 * @param liveSessions - How many sessions are writing at the moment.
 * @param library - How much the library itself holds, where that has been worked out.
 * @param bookPages - How much the kept pages of books hold, shown only once there are some — most
 *   servers have no books, and a row of nothing on every one of them says nothing.
 * @returns The rows to show.
 */
const cacheRows = (
  cache: Monitor['cache'],
  artwork: AdminOverview['artwork'],
  liveSessions: number,
  library: { bytes: number; itemCount: number } | null,
  bookPages: AdminOverview['bookPages'] = null,
): CacheRow[] => {
  const pending = { value: '—', detail: say('admin.cacheRows.stillCounting') };

  return [
    {
      label: say('admin.cacheRows.previews'),
      ...(cache === null
        ? pending
        : {
            value: formatBytes(cache.previews.bytes),
            detail: sayCount('admin.cacheRows.clips', cache.previews.count),
          }),
    },
    {
      label: say('admin.cacheRows.trickplay'),
      ...(cache === null
        ? pending
        : {
            value: formatBytes(cache.trickplay.bytes),
            detail: sayCount('admin.cacheRows.sets', cache.trickplay.count),
          }),
    },
    {
      label: say('admin.cacheRows.sessions'),
      hint: say('admin.cacheRows.sessionsHint'),
      hintLabel: say('admin.cacheRows.sessionsHintLabel'),
      ...(cache === null
        ? pending
        : {
            value: formatBytes(cache.sessions.bytes),
            detail:
              cache.sessions.count <= liveSessions
                ? sayCount('admin.cacheRows.running', cache.sessions.count)
                : sayCount('admin.cacheRows.leftBehind', cache.sessions.count - liveSessions),
          }),
    },
    {
      label: say('admin.cacheRows.artwork'),
      ...(artwork === null
        ? pending
        : {
            value: formatBytes(artwork.bytes),
            detail: sayCount('admin.cacheRows.images', artwork.count),
          }),
    },
    ...(bookPages === null || bookPages.count === 0
      ? []
      : [
          {
            label: say('admin.cacheRows.bookPages'),
            hint: say('admin.cacheRows.bookPagesHint'),
            hintLabel: say('admin.cacheRows.bookPagesHintLabel'),
            value: formatBytes(bookPages.bytes),
            detail: sayCount('admin.cacheRows.pages', bookPages.count),
          },
        ]),
    {
      label: say('admin.cacheRows.library'),
      ...(library === null
        ? pending
        : {
            value: formatBytes(library.bytes),
            detail: sayCount('admin.cacheRows.files', library.itemCount),
          }),
    },
  ];
};

export { cacheRows };
