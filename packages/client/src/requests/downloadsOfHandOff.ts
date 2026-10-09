import type { HandOffDownload } from '@ValenceContracts/schemas/ArrApp';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';

/**
 * What a request handed to a connected app has downloading there, one row a download as Valence's
 * own are shown, with the items each holds and how far along the app says it is.
 *
 * @param request - The request.
 * @param downloads - What the app has downloading for it.
 * @returns Its downloads.
 */
const downloadsOfHandOff = (
  request: Pick<MediaRequest, 'items'>,
  downloads: readonly HandOffDownload[],
): RequestDownload[] =>
  downloads.map((download) => ({
    downloadId: download.id,
    releaseTitle: download.releaseTitle,
    items: request.items.filter((item) => download.itemIds.includes(item.id)),
    queued: {
      progress: download.progress,
      secondsLeft: download.secondsLeft,
      sizeBytes: download.sizeBytes,
      clientName: download.clientName,
      indexerName: null,
      sentAt: '',
    },
  }));

export { downloadsOfHandOff };
