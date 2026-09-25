import type { Download } from '@ValenceContracts/schemas/Download';

const EVERY_MS = 3000;

type WatchADownloadOptions = {
  find: () => Promise<Download | null>;
  report: (percent: number, item: string | null) => void;
  isCancelled: () => boolean;
  everyMs?: number;
};

/**
 * Follows one download from being asked for until it is ready, as the job that stands for it on the
 * jobs page, so the work the media service is doing has a row of its own there.
 *
 * It only watches. The file is prepared, and its row kept up to date, whether or not this runs; a
 * job that stopped would leave the download going on without it.
 *
 * @param options - Where to read the download, where to say how far along it is, and how often.
 * @returns Once it is ready, paused or the job is cancelled.
 * @throws Error where it failed or was thrown away, which is what fails the job.
 */
const watchADownload = async ({
  find,
  report,
  isCancelled,
  everyMs = EVERY_MS,
}: WatchADownloadOptions): Promise<void> => {
  for (;;) {
    const download = await find();

    if (download === null) {
      throw new Error('It was thrown away before it was ready.');
    }

    if (download.state === 'failed') {
      throw new Error(download.failure ?? 'It could not be prepared.');
    }

    if (download.state === 'ready') {
      report(100, null);

      return;
    }

    if (download.state === 'paused' || isCancelled()) {
      return;
    }

    report(Math.round(download.progress * 100), download.title);

    await new Promise((carryOn) => setTimeout(carryOn, everyMs));
  }
};

export { watchADownload };
