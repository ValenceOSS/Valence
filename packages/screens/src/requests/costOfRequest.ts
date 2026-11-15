import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestCost = {
  bytes: number | null;
  seconds: number | null;
};

/**
 * Whether a number was given at all.
 *
 * @param value - The number, or nothing.
 * @returns Whether there is one.
 */
const isGiven = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

/**
 * What a request cost to fetch, added up over the downloads that brought it.
 *
 * Each item carries the size of the download it came in, so the episodes of one season pack all
 * carry the size of the whole pack. Counted once an item, a pack of thirty episodes was counted
 * thirty times over and a season of thirty gigabytes read as most of a terabyte. So the bytes are
 * added up once a download: by the download an item names, or where it names none, as an item
 * handed to another app does not, by the release it came in. The time is not added up at all:
 * downloads are fetched alongside each other, so adding their durations would report a wait nobody
 * had, and the longest one is what the request actually waited on.
 *
 * @param request - The request.
 * @returns How much arrived and how long the longest of it took, each null where nothing said.
 */
const costOfRequest = (request: Pick<MediaRequest, 'items'>): RequestCost => {
  const byDownload = new Map<string, number>();

  for (const item of request.items) {
    const bytes = item.downloadedBytes;

    if (!isGiven(bytes)) {
      continue;
    }

    const download =
      item.downloadId ?? (item.releaseTitle === null ? item.id : `release:${item.releaseTitle}`);

    byDownload.set(download, Math.max(byDownload.get(download) ?? 0, bytes));
  }

  const waits = request.items.map((item) => item.downloadSeconds).filter(isGiven);

  return {
    bytes:
      byDownload.size === 0
        ? null
        : [...byDownload.values()].reduce((total, one) => total + one, 0),
    seconds: waits.length === 0 ? null : Math.max(...waits),
  };
};

export type { RequestCost };

export { costOfRequest };
