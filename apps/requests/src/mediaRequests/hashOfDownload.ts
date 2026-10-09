import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

/**
 * A torrent download's info hash, which its client names it by, so a release blocked for it stays
 * blocked under any other name it is posted as.
 *
 * @param download - The download.
 * @returns The hash in lower-case hex, or nothing for a usenet download.
 */
const hashOfDownload = (
  download: Pick<SentDownloadRecord, 'protocol' | 'remoteId'>,
): string | null =>
  download.protocol === 'torrent' && /^[a-f0-9]{40}$/iu.test(download.remoteId)
    ? download.remoteId.toLowerCase()
    : null;

export { hashOfDownload };
