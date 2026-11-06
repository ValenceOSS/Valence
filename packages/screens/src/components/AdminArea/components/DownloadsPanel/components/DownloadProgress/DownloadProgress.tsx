import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import type { DownloadProgressProps } from './DownloadProgress.types';
import { say } from '@ValenceI18n/say';

/**
 * How far one download has got, the same in Valence's own queue and in a connected app's: the share
 * done with how much has arrived beside it where that is known, over a thin bar the width of both.
 *
 * @param title - What is downloading, for the bar's name.
 * @param progress - How far it has got, from nothing to done.
 * @param children - How much has arrived, where that is known.
 */
const DownloadProgress = ({ title, progress, children }: DownloadProgressProps) => (
  <span className="flex w-40 flex-col gap-1.5">
    <span className="flex items-baseline justify-between gap-3">
      <FormattedNumber
        value={Math.floor(progress * 100)}
        suffix="%"
        className="text-sm font-medium tabular-nums text-text"
      />

      {children === undefined || children === null ? null : (
        <span className="truncate text-xs tabular-nums text-text-muted">{children}</span>
      )}
    </span>

    <ProgressBar
      label={say('common.howFarTitleHasDownloaded', { title })}
      value={Math.round(progress * 1000) / 10}
      isFull
      isThin
    />
  </span>
);

DownloadProgress.displayName = 'DownloadProgress';

export { DownloadProgress };
