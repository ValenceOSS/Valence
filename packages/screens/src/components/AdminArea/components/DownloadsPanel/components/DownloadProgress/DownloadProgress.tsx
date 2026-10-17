import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import type { DownloadProgressProps } from './DownloadProgress.types';
import { say } from '@ValenceI18n/say';

/**
 * How far one download has got, the same in Valence's own queue and in a connected app's: a bar with
 * the share done beside it, and a line beneath for how much has arrived where that is known.
 *
 * @param title - What is downloading, for the bar's name.
 * @param progress - How far it has got, from nothing to done.
 * @param children - The line beneath the bar, where there is one.
 */
const DownloadProgress = ({ title, progress, children }: DownloadProgressProps) => (
  <span className="flex flex-col gap-1">
    <ProgressBar
      label={say('common.howFarTitleHasDownloaded', { title })}
      value={Math.round(progress * 1000) / 10}
      readout={
        <FormattedNumber
          value={Math.floor(progress * 100)}
          suffix="%"
          className="text-xs text-text"
        />
      }
    />

    {children === undefined || children === null ? null : (
      <span className="text-xs tabular-nums text-text-muted">{children}</span>
    )}
  </span>
);

DownloadProgress.displayName = 'DownloadProgress';

export { DownloadProgress };
