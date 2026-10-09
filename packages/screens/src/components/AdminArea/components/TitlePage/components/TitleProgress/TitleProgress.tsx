import { cn } from '@ValenceUI/cn';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { partOfItem } from '@ValenceClient/requests/partOfItem';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import { DownloadRow } from '@ValenceScreens/components/AdminArea/components/TitlePage/components/DownloadRow/DownloadRow';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';
import type { TitleProgressProps } from './TitleProgress.types';
import { say } from '@ValenceI18n/say';

const PART_ORDER: readonly TitlePart[] = [
  'library',
  'downloading',
  'missing',
  'failed',
  'toApprove',
  'waiting',
  'notFollowed',
];

/**
 * How a request is going, on its title's page: one bar of everything it waits for, coloured by
 * where each stands, with a count of each, a line saying what is happening now, and one row for
 * each download, season packs and single episodes alike, each with its own way to stop it.
 *
 * @param request - The request.
 * @param downloads - What it has downloading.
 * @param onStop - Told a download to stop.
 */
const TitleProgress = ({ request, downloads, onStop }: TitleProgressProps) => {
  const counts = new Map<TitlePart, number>();

  for (const item of request.items) {
    const part = partOfItem(item, request.approval);

    counts.set(part, (counts.get(part) ?? 0) + 1);
  }

  const total = request.items.length;
  const shown = PART_ORDER.filter((part) => (counts.get(part) ?? 0) > 0);
  const now = describeRequestProgress(request);

  return (
    <PanelCard title={say('common.progress')}>
      <div className="flex flex-col gap-4">
        {total === 0 ? null : (
          <>
            <span
              role="img"
              aria-label={say('screens.adminArea.titlePage.titleProgress.whereEverythingStands')}
              className="flex h-2.5 overflow-hidden rounded-full bg-[var(--surface-active)]"
            >
              {shown.map((part) => (
                <span
                  key={part}
                  className={TITLE_PART_LOOKS[part].cell}
                  style={{ width: `${(((counts.get(part) ?? 0) / total) * 100).toString()}%` }}
                />
              ))}
            </span>

            <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {shown.map((part) => (
                <span key={part} className="flex items-center gap-2 text-sm text-text-muted">
                  <span className={cn('size-2.5 rounded-full', TITLE_PART_LOOKS[part].cell)} />
                  <span className="font-medium tabular-nums text-text">
                    {(counts.get(part) ?? 0).toString()}
                  </span>
                  {TITLE_PART_LOOKS[part].label}
                </span>
              ))}
            </span>
          </>
        )}

        {now === null ? null : <p className="text-sm text-text-muted">{now}</p>}

        {downloads.length === 0 ? null : (
          <ul className="flex flex-col divide-y divide-[var(--surface-line)] overflow-hidden rounded-xl border border-[var(--surface-line)] bg-[var(--surface-hover)]">
            {downloads.map((download) => (
              <DownloadRow key={download.downloadId} download={download} onStop={onStop} />
            ))}
          </ul>
        )}
      </div>
    </PanelCard>
  );
};

TitleProgress.displayName = 'TitleProgress';

export { TitleProgress };
