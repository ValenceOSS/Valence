import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import type { DownloadRowProps } from './DownloadRow.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One of a title's downloads: the release, how far along it is and how long it has left, whether
 * it was picked by hand, what it holds and where it came from, and a quiet cross to stop it.
 *
 * @param download - The download.
 * @param onStop - Told to stop it.
 */
const DownloadRow = ({ download, onStop }: DownloadRowProps) => {
  const { queued, items } = download;
  const percent = Math.round((queued?.progress ?? 0) * 100);
  const holds = items.length;

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
            {download.releaseTitle}
          </span>
          {queued?.secondsLeft === null || queued?.secondsLeft === undefined ? null : (
            <span className="shrink-0 text-xs tabular-nums text-text-muted">
              {describeTimeLeft(queued.secondsLeft)}
            </span>
          )}
        </span>

        <ProgressBar
          label={say('screens.offlineShelf.fetchingTitle', {
            title: download.releaseTitle,
          })}
          value={percent}
          isFull
          isThin
        />

        <span className="flex flex-wrap items-center gap-x-2 truncate text-xs text-text-muted">
          {items.some((item) => item.isPickedByHand === true) ? (
            <span>{say('screens.adminArea.titlePage.downloadRow.pickedByHand')}</span>
          ) : null}
          {holds > 1 ? <span>{sayCount('common.count.episodes', holds)}</span> : null}
          {queued?.sizeBytes === null || queued?.sizeBytes === undefined ? null : (
            <FormattedBytes bytes={queued.sizeBytes} />
          )}
          {queued === null ? null : <span>{queued.clientName}</span>}
          {queued?.indexerName === null || queued?.indexerName === undefined ? null : (
            <span>{queued.indexerName}</span>
          )}
        </span>
      </span>

      <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-text">
        {say('common.percent', { value: percent.toString() })}
      </span>

      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        label={say('screens.adminArea.titlePage.downloadRow.stopDownload')}
        onClick={() => {
          onStop(download);
        }}
      >
        <Icon of={XIcon} size={15} />
      </Button>
    </li>
  );
};

DownloadRow.displayName = 'DownloadRow';

export { DownloadRow };
