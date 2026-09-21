import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestCost = {
  bytes: number | null;
  seconds: number | null;
};

/**
 * What a request cost to fetch, added up over everything it brought.
 *
 * The bytes add up because a season is many downloads and what somebody wants to know is what the
 * season cost. The time does not: episodes are fetched alongside each other, so adding their
 * durations would report a wait nobody had. The longest one is what the request actually waited on.
 *
 * @param request - The request.
 * @returns How much arrived and how long the longest of it took, each null where nothing said.
 */
const costOfRequest = (request: Pick<MediaRequest, 'items'>): RequestCost => {
  const sizes = request.items.map((item) => item.downloadedBytes).filter((bytes) => bytes !== null);
  const waits = request.items
    .map((item) => item.downloadSeconds)
    .filter((seconds) => seconds !== null);

  return {
    bytes: sizes.length === 0 ? null : sizes.reduce((total, bytes) => total + bytes, 0),
    seconds: waits.length === 0 ? null : Math.max(...waits),
  };
};

export type { RequestCost };

export { costOfRequest };
