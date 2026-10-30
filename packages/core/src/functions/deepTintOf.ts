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
 * Deepens a colour into a ground to write on: its hue kept, its colour only gentle, and set dark so
 * words in the usual colour read on it — with the oranges and browns that skin and lamps give held
 * nearer a warm charcoal, so a face does not turn everything behind it brown.
 *
 * @param channels - The colour's red, green and blue, each from 0 to 255.
 * @returns The ground as `rgb(…)`.
 */
const deepTintOf = ([red, green, blue]: readonly [number, number, number]): string => {
  const { hue, saturation } = toHsl(red / 255, green / 255, blue / 255);
  const isWarm = hue >= WARM_FROM && hue <= WARM_TO;

  return fromHsl(
    hue,
    Math.min(saturation, isWarm ? MOST_WARM_SATURATION : MOST_SATURATION),
    LIGHTNESS,
  );
};

export { deepTintOf };
