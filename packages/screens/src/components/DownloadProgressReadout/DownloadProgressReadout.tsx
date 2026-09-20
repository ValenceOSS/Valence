import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { cn } from '@ValenceUI/cn';
import { describeDownloadProgress } from '@ValenceScreens/components/RequestsPage/components/MyRequests/describeDownloadProgress';
import type { DownloadProgressReadoutProps } from './DownloadProgressReadout.types';

/**
 * How far a download has got, for whoever is waiting on it: the percentage, then how much has
 * arrived, how fast and how long is left, every number rolling as it changes.
 *
 * @param progress - How the download is going.
 * @param className - Extra classes for the caller's own colour and layout.
 */
const DownloadProgressReadout = ({ progress, className }: DownloadProgressReadoutProps) => {
  const facts = describeDownloadProgress(progress);

  return (
    <span className={cn('text-xs tabular-nums', className)}>
      <AnimatedNumber value={Math.floor(progress.progress * 100)} suffix="%" />
      {facts === null ? null : <> · {facts}</>}
    </span>
  );
};

DownloadProgressReadout.displayName = 'DownloadProgressReadout';

export { DownloadProgressReadout };
