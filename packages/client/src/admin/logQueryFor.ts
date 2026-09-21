import { logRangeStart } from './logRanges';
import type { LogView } from './logView.types';
import type { LogFacetsQuery, LogHistogramQuery, LogQuery } from '@ValenceContracts/schemas/Log';

const BARS = 48;

/**
 * What every question about the log has in common: which records, in which stretch of time.
 *
 * A zoom — a stretch of time picked on the graph — takes over from the range it was picked within,
 * and a range that has no start asks for everything kept.
 *
 * @param view - What the explorer is showing.
 * @param nowMs - The moment the ranges are counted back from.
 * @returns The filters.
 */
const logFacetsQueryFor = (view: LogView, nowMs: number): LogFacetsQuery => ({
  levels: view.levels,
  sources: view.sources,
  search: view.search,
  sinceMs: view.zoom?.fromMs ?? logRangeStart(view.range, nowMs),
  untilMs: view.zoom?.untilMs ?? null,
  jobId: view.ids.jobId ?? null,
  jobKinds: view.jobKinds,
  libraryId: view.ids.libraryId ?? null,
  mediaId: view.ids.mediaId ?? null,
  sessionId: view.ids.sessionId ?? null,
  requestId: view.ids.requestId ?? null,
});

/**
 * What the server is asked to count for the graph above the log: the same records, over the same
 * time, so the graph always describes the rows beneath it.
 *
 * @param view - What the explorer is showing.
 * @param nowMs - The moment the ranges are counted back from.
 * @returns The query.
 */
const logHistogramQueryFor = (view: LogView, nowMs: number): LogHistogramQuery => ({
  ...logFacetsQueryFor(view, nowMs),
  buckets: BARS,
});

/**
 * What the server is asked for a page of the log, from what the explorer is showing.
 *
 * @param view - What the explorer is showing.
 * @param nowMs - The moment the ranges are counted back from.
 * @returns The query.
 */
const logQueryFor = (view: LogView, nowMs: number): LogQuery => ({
  ...logFacetsQueryFor(view, nowMs),
  sort: view.sort,
  offset: 0,
  limit: view.limit,
});

export { logQueryFor, logHistogramQueryFor, logFacetsQueryFor };
