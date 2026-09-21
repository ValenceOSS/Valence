import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

type DownloadFacts = {
  downloadedBytes: number | null;
  downloadSeconds: number | null;
};

/**
 * What a download cost, kept on the item it brought: how large it was and how long it took.
 *
 * Copied onto the request rather than read back from the queue when somebody asks. A finished
 * download is swept out of the client and out of Valence's own queue soon enough, and "it took
 * twenty minutes" is a fact about the request that should outlive both.
 *
 * Seconds are worked out from when the download was sent, not from when the client started it:
 * what somebody who asked for a film wants to know is how long they waited, and the wait includes
 * sitting in a queue.
 *
 * @param download - The download as the client left it.
 * @returns How large it was and how long it took, each null where that cannot be said.
 */
const downloadFacts = (
  download: Pick<SentDownloadRecord, 'sizeBytes' | 'doneBytes' | 'sentAt' | 'finishedAt'>,
): DownloadFacts => {
  const took =
    download.finishedAt === null
      ? null
      : (Date.parse(download.finishedAt) - Date.parse(download.sentAt)) / 1000;

  return {
    downloadedBytes: download.doneBytes ?? download.sizeBytes,
    downloadSeconds: took === null || !Number.isFinite(took) || took < 0 ? null : took,
  };
};

export type { DownloadFacts };

export { downloadFacts };
