import { channelsOf } from '@ValenceCore/functions/channelsOf';
import { deepTintOf } from '@ValenceCore/functions/deepTintOf';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const AT = /^\s*[\d.]+%\s+([\d.]+)%/u;

/**
 * The colour to tint a card with, taken from the lights read off its picture: the average of the
 * row along the picture's foot, where it fades into the card, so the join cannot be seen, deepened
 * into a ground to write on.
 *
 * @param lights - The lights read off the picture.
 * @returns The tint as `rgb(…)`, or nothing where there are no lights to take it from.
 */
const cardTintOf = (lights: readonly ALight[]): string | null => {
  const placed = lights.flatMap((light) => {
    const down = AT.exec(light.at)?.[1];
    const channels = channelsOf(light.colour);

    return down === undefined || channels === null ? [] : [{ down: Number(down), channels }];
  });
  const foot = Math.max(...placed.map((light) => light.down));
  const along = placed.filter((light) => light.down === foot);

  if (along.length === 0) {
    return null;
  }

  const [red, green, blue] = [0, 1, 2].map(
    (index) => along.reduce((sum, light) => sum + (light.channels[index] ?? 0), 0) / along.length,
  );

  return deepTintOf([red ?? 0, green ?? 0, blue ?? 0]);
};

export { cardTintOf };
