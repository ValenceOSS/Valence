const FALLBACK_SPAN_MS = 3_600_000;

const SMALLEST_BUCKET_MS = 1000;

/**
 * Works out the stretch of time a histogram covers and how wide each of its bars is.
 *
 * Where the operator gave no start it begins at the earliest record there is, so "everything" is a
 * graph of everything rather than of an hour with nothing in it. Bars begin on a multiple of their
 * own width, so reading the same range again a moment later moves the bars no further than the end.
 *
 * @param range - The start and end asked for, either of which may be nothing.
 * @param earliestMs - When the earliest matching record was written, or nothing where none was.
 * @param nowMs - The present moment.
 * @param buckets - How many bars are wanted, at most.
 * @returns The first bar's start, the end, and the width of a bar.
 */
const histogramWindow = (
  range: { sinceMs: number | null; untilMs: number | null },
  earliestMs: number | null,
  nowMs: number,
  buckets: number,
): { fromMs: number; untilMs: number; bucketMs: number } => {
  const untilMs = range.untilMs ?? nowMs;
  const start = range.sinceMs ?? earliestMs ?? untilMs - FALLBACK_SPAN_MS;
  const span = Math.max(untilMs - start, SMALLEST_BUCKET_MS);
  const bucketMs = Math.max(SMALLEST_BUCKET_MS, Math.ceil(span / buckets));

  return { fromMs: Math.floor(start / bucketMs) * bucketMs, untilMs, bucketMs };
};

export { histogramWindow };
