import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';

import { ProgressBar } from '@ValenceUI/ProgressBar';
import { formatBytes } from '@ValenceCore/functions/formatBytes';

import { cacheRows } from './cacheRows';
import type { CacheBreakdownProps } from './CacheBreakdown.types';
import { say } from '@ValenceI18n/say';

/**
 * What Valence itself is keeping on the disk: the total first, then a kind at a time — preview
 * clips, scrub thumbnails, artwork, the pages of books, and what is being written for sessions
 * running now — each with a bar of its share of that total. The library's own files are set apart
 * at the foot, since they dwarf everything else and the useful question is how much Valence has
 * added to what was already there.
 *
 * @param cache - What the monitor found on disk, or null while it is still counting.
 * @param artwork - How much artwork has been fetched and kept.
 * @param bookPages - How much the kept pages of books hold.
 * @param liveSessions - How many sessions are writing at the moment.
 * @param library - How much the library itself holds, where that has been worked out.
 */
const CacheBreakdown = ({
  cache,
  artwork,
  bookPages = null,
  liveSessions,
  library,
}: CacheBreakdownProps) => {
  const rows = cacheRows(cache, artwork, liveSessions, library, bookPages);
  const kept = rows.filter((row) => row.isLibrary !== true);
  const libraryRow = rows.find((row) => row.isLibrary === true);
  const keptBytes = kept.reduce((sum, row) => sum + (row.bytes ?? 0), 0);

  const nameOf = (row: (typeof rows)[number]) => (
    <dt className="flex items-center gap-1.5 text-sm text-text">
      {row.label}

      {row.hint === undefined ? null : (
        <PanelCardInfo
          side="top"
          align="center"
          label={say('screens.adminArea.cacheBreakdown.whatLabelMeans', {
            label: row.label.toLowerCase(),
          })}
          detail={row.hint}
        />
      )}
    </dt>
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-muted">
          {say('screens.adminArea.cacheBreakdown.keptByValence')}
        </span>
        <span className="font-sans text-3xl font-semibold tabular-nums tracking-tight text-text">
          {formatBytes(keptBytes)}
        </span>
      </div>

      <dl className="flex flex-col gap-4">
        {kept.map((row) => (
          <div key={row.label} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                {nameOf(row)}
                <dd className="text-xs text-text-muted">{row.detail}</dd>
              </div>
              <dd className="shrink-0 text-sm font-medium tabular-nums text-text">{row.value}</dd>
            </div>

            <ProgressBar
              label={row.label}
              value={row.bytes === null || keptBytes === 0 ? null : row.bytes}
              max={Math.max(keptBytes, 1)}
              isThin
            />
          </div>
        ))}
      </dl>

      {libraryRow === undefined ? null : (
        <dl className="mt-auto flex items-start justify-between gap-4 border-t border-[var(--surface-line)] pt-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            {nameOf(libraryRow)}
            <dd className="text-xs text-text-muted">{libraryRow.detail}</dd>
          </div>
          <dd className="shrink-0 text-sm font-medium tabular-nums text-text">
            {libraryRow.value}
          </dd>
        </dl>
      )}
    </div>
  );
};

CacheBreakdown.displayName = 'CacheBreakdown';

export { CacheBreakdown };
