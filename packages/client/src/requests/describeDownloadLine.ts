import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * Says how a download is going in one line of words, for a screen that shows it as text rather
 * than as rolling numbers: how much of it has come, how fast it is coming, and how long is left.
 *
 * @param progress - How the download is going.
 * @returns Such as `40 MB of 120 MB · 2.1 MB/s · 3 min left`, or nothing where nothing is known —
 *   a size the download client has not learnt yet is left out rather than said as nothing.
 */
const describeDownloadLine = (progress: RequestProgress): string | null => {
  const parts: string[] = [];

  if (progress.sizeBytes !== null && progress.sizeBytes > 0) {
    parts.push(
      progress.doneBytes === null
        ? formatBytes(progress.sizeBytes)
        : say('common.doneOfTotal', {
            done: formatBytes(progress.doneBytes),
            total: formatBytes(progress.sizeBytes),
          }),
    );
  }

  if (progress.downloadBytesPerSecond !== null && progress.downloadBytesPerSecond !== 0) {
    parts.push(`${formatBytes(progress.downloadBytesPerSecond)}/s`);
  }

  if (progress.secondsLeft !== null) {
    const left = partsOfTimeLeft(progress.secondsLeft);

    parts.push(
      left === null
        ? say('client.requests.describeDownloadLine.underAMinuteLeft')
        : say('common.durationLeft', {
            timeLeft: left.map((part) => `${part.value.toString()} ${part.unit}`).join(' '),
          }),
    );
  }

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeDownloadLine };
