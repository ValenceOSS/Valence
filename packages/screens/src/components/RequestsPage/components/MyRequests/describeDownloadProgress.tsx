import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says how a download is coming along, for whoever is waiting on it: how much has arrived, how
 * fast, and how long is left, with every number rolling as it changes.
 *
 * @param progress - How the download is going.
 * @returns Such as `2.0 GB of 4.0 GB · 3.0 MB/s · 12 min left`, or null where nothing is known.
 */
const describeDownloadProgress = (progress: RequestProgress): ReactNode => {
  const parts: ReactNode[] = [];

  if (progress.sizeBytes !== null) {
    parts.push(
      progress.doneBytes === null ? (
        <AnimatedBytes bytes={progress.sizeBytes} />
      ) : (
        <>
          <AnimatedBytes bytes={progress.doneBytes} /> of{' '}
          <AnimatedBytes bytes={progress.sizeBytes} />
        </>
      ),
    );
  }

  if (progress.downloadBytesPerSecond !== null && progress.downloadBytesPerSecond !== 0) {
    parts.push(<AnimatedBytes bytes={progress.downloadBytesPerSecond} suffix="/s" />);
  }

  if (progress.secondsLeft !== null) {
    parts.push(<>{describeTimeLeft(progress.secondsLeft)} left</>);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.map((part, at) => (
    <Fragment key={at.toString()}>
      {at === 0 ? null : ' · '}
      {part}
    </Fragment>
  ));
};

export { describeDownloadProgress };
