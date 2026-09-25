import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * How a download is going, as the separate things worth saying about it: how far through it is,
 * how much has arrived of how much, how fast it is arriving and how long is left — each only where
 * the server knows it.
 *
 * @param progress - How the download is going.
 * @returns Each part in words, or nothing for a part the server does not know.
 */
const partsOfDownload = (
  progress: RequestProgress,
): { percent: string; arrived: string | null; speed: string | null; left: string | null } => {
  const timeLeft = progress.secondsLeft === null ? null : partsOfTimeLeft(progress.secondsLeft);

  return {
    percent: `${Math.round(progress.progress * 100).toString()}%`,
    arrived:
      progress.sizeBytes === null
        ? null
        : progress.doneBytes === null
          ? formatBytes(progress.sizeBytes)
          : say('tv.partsOfDownload.arrivedOf', {
              done: formatBytes(progress.doneBytes),
              size: formatBytes(progress.sizeBytes),
            }),
    speed:
      progress.downloadBytesPerSecond === null || progress.downloadBytesPerSecond === 0
        ? null
        : `${formatBytes(progress.downloadBytesPerSecond)}/s`,
    left:
      progress.secondsLeft === null
        ? null
        : timeLeft === null
          ? say('tv.partsOfDownload.underAMinute')
          : timeLeft.map((part) => `${part.value.toString()} ${part.unit}`).join(' '),
  };
};

export { partsOfDownload };
