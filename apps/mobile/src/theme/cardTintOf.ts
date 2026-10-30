import { channelsOf } from '@ValenceCore/functions/channelsOf';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const AT = /^\s*[\d.]+%\s+([\d.]+)%/u;

const LIGHTNESS = 0.16;

const MOST_SATURATION = 0.38;

const WARM_FROM = 12;

const WARM_TO = 50;

const MOST_WARM_SATURATION = 0.16;

/**
 * Turns a colour's channels into its hue in degrees, saturation and lightness.
 *
 * @param red - From 0 to 1.
 * @param green - From 0 to 1.
 * @param blue - From 0 to 1.
 * @returns The hue, saturation and lightness.
 */
const toHsl = (red: number, green: number, blue: number) => {
  const most = Math.max(red, green, blue);
  const least = Math.min(red, green, blue);
  const lightness = (most + least) / 2;
  const range = most - least;

  if (range === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation = range / (1 - Math.abs(2 * lightness - 1));
  const hue =
    most === red
      ? ((green - blue) / range + 6) % 6
      : most === green
        ? (blue - red) / range + 2
        : (red - green) / range + 4;

  return { hue: hue * 60, saturation, lightness };
};

/**
 * Turns a hue in degrees, saturation and lightness back into `rgb(…)`.
 *
 * @param hue - In degrees.
 * @param saturation - From 0 to 1.
 * @param lightness - From 0 to 1.
 * @returns The colour.
 */
const fromHsl = (hue: number, saturation: number, lightness: number): string => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const step = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const [red, green, blue] =
    hue < 60
      ? [chroma, step, 0]
      : hue < 120
        ? [step, chroma, 0]
        : hue < 180
          ? [0, chroma, step]
          : hue < 240
            ? [0, step, chroma]
            : hue < 300
              ? [step, 0, chroma]
              : [chroma, 0, step];

  return `rgb(${[red, green, blue].map((channel) => Math.round((channel + base) * 255).toString()).join(', ')})`;
};

/**
 * The colour to tint a card with, taken from the lights read off its picture: the average of the
 * row along the picture's foot, where it fades into the card, so the join cannot be seen — set deep
 * and only gently coloured so words read on it, and with the oranges and browns that skin and lamps
 * give held nearer a warm charcoal, so a face does not turn the whole card brown.
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
    (index) =>
      along.reduce((sum, light) => sum + (light.channels[index] ?? 0), 0) / along.length / 255,
  );
  const { hue, saturation } = toHsl(red ?? 0, green ?? 0, blue ?? 0);
  const isWarm = hue >= WARM_FROM && hue <= WARM_TO;

  return fromHsl(
    hue,
    Math.min(saturation, isWarm ? MOST_WARM_SATURATION : MOST_SATURATION),
    LIGHTNESS,
  );
};

export { cardTintOf };
