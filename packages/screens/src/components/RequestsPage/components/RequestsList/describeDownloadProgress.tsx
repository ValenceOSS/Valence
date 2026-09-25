import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * Says how a download is coming along, for whoever is waiting on it: how much has arrived, how
 * fast, and how long is left, with every number rolling as it changes.
 *
 * @param progress - How the download is going.
 * @returns Such as `2.0 GB of 4.0 GB · 3.0 MB/s · 12 min left`, or null where nothing is known.
 */
const describeDownloadProgress = (progress: RequestProgress): ReactNode => {
  const parts: ReactNode[] = [];

  const { sizeBytes, doneBytes, secondsLeft } = progress;

  if (sizeBytes !== null) {
    parts.push(
      doneBytes === null ? (
        <AnimatedBytes bytes={sizeBytes} />
      ) : (
        <>
          {say('screens.describeDownloadProgress.doneOfSize')
            .split(/(\{done\}|\{size\})/u)
            .map((piece, at) =>
              piece === '{done}' ? (
                <AnimatedBytes key={at.toString()} bytes={doneBytes} />
              ) : piece === '{size}' ? (
                <AnimatedBytes key={at.toString()} bytes={sizeBytes} />
              ) : (
                piece
              ),
            )}
        </>
      ),
    );
  }

  if (progress.downloadBytesPerSecond !== null && progress.downloadBytesPerSecond !== 0) {
    parts.push(<AnimatedBytes bytes={progress.downloadBytesPerSecond} suffix="/s" />);
  }

  if (secondsLeft !== null) {
    parts.push(
      <>
        {say('screens.describeDownloadProgress.timeLeft')
          .split(/(\{time\})/u)
          .map((piece, at) =>
            piece === '{time}' ? (
              <Fragment key={at.toString()}>{describeTimeLeft(secondsLeft)}</Fragment>
            ) : (
              piece
            ),
          )}
      </>,
    );
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
