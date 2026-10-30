import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const RGB = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/iu;

const KEPT = 0.42;

/**
 * The colour to tint what is playing with, taken from the lights read off its cover: the most vivid
 * of them, darkened so words in the usual colour stay easy to read on it.
 *
 * @param lights - The lights read off the cover.
 * @returns The tint as `rgb(…)`, or nothing where there are no lights to take it from.
 */
const tintOf = (lights: readonly ALight[]): string | null => {
  const channels = lights
    .map((light) => RGB.exec(light.colour))
    .filter((found) => found !== null)
    .map((found) => [Number(found[1]), Number(found[2]), Number(found[3])] as const);
  const vivid = channels.reduce<readonly [number, number, number] | null>(
    (best, one) =>
      best === null || Math.max(...one) - Math.min(...one) > Math.max(...best) - Math.min(...best)
        ? one
        : best,
    null,
  );

  return vivid === null
    ? null
    : `rgb(${vivid.map((channel) => Math.round(channel * KEPT).toString()).join(', ')})`;
};

export { tintOf };
