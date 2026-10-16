import { matchBook } from '@ValenceRequests/mediaRequests/matchBook';
import { seriesOfBook } from '@ValenceRequests/mediaRequests/seriesOfBook';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

const RANGE =
  /(?<![\d.])(\d{1,3}(?:\.\d+)?)\s*(?:[-–~]|thru|through)\s*(\d{1,3}(?:\.\d+)?)(?![\d.])/i;

const PACKED = /\b(?:series|collection|complete|box(?:ed)?\s*set|saga|omnibus|trilogy)\b/i;

/**
 * Whether a release is a pack of the series a book was asked for as part of: it names the series, as
 * a book is named, and says, beside the series' own name, that it is several books — a range of
 * them that takes in the book's place in the series, or a collection, box set, series or saga.
 *
 * @param request - The book, with its narrations, which say its series.
 * @param releaseTitle - The release's name.
 * @returns Whether it is a pack of the book's series.
 */
const isSeriesPack = (
  request: Pick<MediaRequestRecord, 'narrations' | 'artistName' | 'seriesRequestId'>,
  releaseTitle: string,
): boolean => {
  const series = seriesOfBook(request);

  if (series === null) {
    return false;
  }

  const seriesWords = new Set(series.toLowerCase().split(/[^\p{L}\p{N}]+/u));
  const rest = releaseTitle
    .split(/([^\p{L}\p{N}]+)/u)
    .map((part) => (seriesWords.has(part.toLowerCase()) ? ' ' : part))
    .join('');

  const range = RANGE.exec(rest);
  const place = Number(
    (request.narrations ?? []).find((narration) => (narration.seriesPosition ?? null) !== null)
      ?.seriesPosition ?? Number.NaN,
  );
  const isInRange =
    range === null ||
    Number.isNaN(place) ||
    (Number(range[1]) <= place && place <= Number(range[2]));

  return (
    (range !== null || PACKED.test(rest)) &&
    isInRange &&
    matchBook({ title: series, aliases: [], artistName: request.artistName }, releaseTitle)
  );
};

export { isSeriesPack };
