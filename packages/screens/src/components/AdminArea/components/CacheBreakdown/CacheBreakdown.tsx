import { useState } from 'react';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { cn } from '@ValenceUI/cn';
import { DotBar } from '@ValenceUI/DotBar';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { formatBytes } from '@ValenceCore/functions/formatBytes';

import { cacheRows } from './cacheRows';
import type { CacheBreakdownProps } from './CacheBreakdown.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const COLOURS = [
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-highlight)',
  'var(--color-busy)',
  'var(--color-danger)',
] as const;

/**
 * What Valence itself is keeping on the disk: the total first, then a kind at a time — preview
 * clips, scrub thumbnails, artwork, the pages of books, and what is being written for sessions
 * running now — drawn as one bar divided between them, with each kind listed beneath it in its
 * colour, with its size and its share of the total. Pointing at a kind in the list or the bar lights
 * it in both. The library's own files are set apart
 * at the foot, since they dwarf everything else and the useful question is how much Valence has
 * added to what was already there. While downloads are coming, the foot also estimates how large
 * they all are, with a bar of how much of that has arrived.
 *
 * @param cache - What the monitor found on disk, or null while it is still counting.
 * @param artwork - How much artwork has been fetched and kept.
 * @param bookPages - How much the kept pages of books hold.
 * @param liveSessions - How many sessions are writing at the moment.
 * @param library - How much the library itself holds, where that has been worked out.
 * @param incoming - The downloads still coming, where the queue has been read.
 */
const CacheBreakdown = ({
  cache,
  artwork,
  bookPages = null,
  liveSessions,
  library,
  incoming = null,
}: CacheBreakdownProps) => {
  const rows = cacheRows(cache, artwork, liveSessions, library, bookPages);
  const kept = rows.filter((row) => row.isLibrary !== true);
  const keptBytes = kept.reduce((sum, row) => sum + (row.bytes ?? 0), 0);
  const [pointed, setPointed] = useState<string | null>(null);
  const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
  const colourOf = (index: number) => COLOURS[index % COLOURS.length] ?? COLOURS[0];

  const nameOf = (row: Pick<(typeof rows)[number], 'label' | 'hint'>) => (
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

      {keptBytes === 0 ? null : (
        <DotBar
          className="h-4 rounded-full"
          label={say('screens.adminArea.cacheBreakdown.howItSplits')}
          litId={pointed}
          onPoint={setPointed}
          segments={kept.flatMap((row, index) =>
            (row.bytes ?? 0) === 0
              ? []
              : [{ id: row.label, share: (row.bytes ?? 0) / keptBytes, colour: colourOf(index) }],
          )}
        />
      )}

      <dl className="-mx-2 flex flex-col">
        {kept.map((row, index) => (
          <div
            key={row.label}
            onPointerEnter={() => {
              setPointed(row.label);
            }}
            onPointerLeave={() => {
              setPointed(null);
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-[var(--duration-fast)]',
              pointed === row.label && 'bg-[var(--surface-hover)]',
            )}
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: colourOf(index) }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {nameOf(row)}
              <dd className="text-xs text-text-muted">{row.detail}</dd>
            </div>
            <dd className="w-14 shrink-0 text-right text-xs tabular-nums text-text-muted">
              {row.bytes === null || keptBytes === 0 ? '—' : percent.format(row.bytes / keptBytes)}
            </dd>
            <dd className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-text">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {incoming === null || incoming.count === 0 ? null : (
        <dl className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              {nameOf({
                label: say('screens.adminArea.cacheBreakdown.estimatedSizeOfDownloads'),
                hint: say('screens.adminArea.cacheBreakdown.whatTheDownloadsCount'),
              })}
              <dd className="text-xs text-text-muted">
                {sayCount('screens.adminArea.cacheBreakdown.stillToDownload', incoming.count, {
                  left: formatBytes(incoming.totalBytes - incoming.doneBytes),
                })}
              </dd>
              {incoming.unsizedCount === 0 ? null : (
                <dd className="text-xs text-text-muted">
                  {sayCount(
                    'screens.adminArea.cacheBreakdown.withoutASizeYet',
                    incoming.unsizedCount,
                  )}
                </dd>
              )}
            </div>
            <dd className="shrink-0 text-sm font-medium tabular-nums text-text">
              {formatBytes(incoming.totalBytes)}
            </dd>
          </div>

          <ProgressBar
            label={say('screens.adminArea.cacheBreakdown.estimatedSizeOfDownloads')}
            value={incoming.doneBytes}
            max={Math.max(incoming.totalBytes, 1)}
            isThin
          />
        </dl>
      )}
    </div>
  );
};

CacheBreakdown.displayName = 'CacheBreakdown';

export { CacheBreakdown };
