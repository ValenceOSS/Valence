import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';

const NAMED: ReadonlySet<string> = new Set(['2160p', '1440p', '1080p', '720p', '480p']);

const PLAIN_RANGES = new Set(['SDR', '']);

/**
 * Says what a file looks like in the words a person uses for it — "4K HDR10" rather than 3840 by 2160
 * with a range field beside it.
 *
 * @param width - How many columns the picture has.
 * @param height - How many rows it has.
 * @param videoRange - The dynamic range the file declares.
 * @returns What to call it, or null where nothing is known.
 */
const describeQuality = (
  width: number | null,
  height: number | null,
  videoRange: string | null,
): string | null => {
  const step = width === null || height === null ? null : sharpestStepOf({ width, height });
  const resolution = step !== null && NAMED.has(step.id) ? step.label : null;
  const range = videoRange === null || PLAIN_RANGES.has(videoRange) ? null : videoRange;

  if (resolution === null) {
    return range;
  }

  return range === null ? resolution : `${resolution} ${range}`;
};

export { describeQuality };
