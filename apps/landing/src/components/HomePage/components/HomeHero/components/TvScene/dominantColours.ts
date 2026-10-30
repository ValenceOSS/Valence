const HUE_BUCKETS = 12;

const DARKEST = 0.08;

const LIGHTEST = 0.92;

const GREYEST = 0.12;

const NOTICEABLE = 0.08;

const FALLBACK = ['#4f74d9', '#3c4f9a', '#6a8cf0'] as const;

type Bucket = { red: number; green: number; blue: number; weight: number };

const hexOf = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

const hslOf = (red: number, green: number, blue: number): [number, number, number] => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const lightness = (high + low) / 2;
  const spread = high - low;

  if (spread === 0) {
    return [0, 0, lightness];
  }

  const saturation = spread / (1 - Math.abs(2 * lightness - 1));
  const hue =
    high === r
      ? ((g - b) / spread + 6) % 6
      : high === g
        ? (b - r) / spread + 2
        : (r - g) / spread + 4;

  return [hue * 60, saturation, lightness];
};

const fromHsl = (hue: number, saturation: number, lightness: number): string => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const part = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  const sector = Math.floor(hue / 60) % 6;
  const [r = 0, g = 0, b = 0] = [
    [chroma, part, 0],
    [part, chroma, 0],
    [0, chroma, part],
    [0, part, chroma],
    [part, 0, chroma],
    [chroma, 0, part],
  ][sector] ?? [0, 0, 0];

  return hexOf((r + base) * 255, (g + base) * 255, (b + base) * 255);
};

const brightened = ({ red, green, blue, weight }: Bucket): string => {
  const [hue, saturation, lightness] = hslOf(red / weight, green / weight, blue / weight);

  return fromHsl(
    hue,
    Math.min(0.9, Math.max(0.5, saturation * 1.3)),
    Math.min(0.62, Math.max(0.5, lightness)),
  );
};

/**
 * Finds the few colours a picture is mostly made of, by hue, passing over its near-black,
 * near-white and grey pixels and lifting what it finds so it reads as light thrown onto a wall.
 *
 * @param pixels - The picture's pixels, four values each: red, green, blue and alpha.
 * @param count - How many colours to find.
 * @returns The colours as `#rrggbb`, strongest first, repeated when the picture has fewer than
 *   asked for, and Valence's blues when it has none.
 */
const dominantColours = (pixels: ArrayLike<number>, count = 3): readonly string[] => {
  const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, () => ({
    red: 0,
    green: 0,
    blue: 0,
    weight: 0,
  }));

  for (let at = 0; at + 3 < pixels.length; at += 4) {
    const red = pixels[at] ?? 0;
    const green = pixels[at + 1] ?? 0;
    const blue = pixels[at + 2] ?? 0;
    const [hue, saturation, lightness] = hslOf(red, green, blue);
    const bucket = buckets[Math.floor(hue / (360 / HUE_BUCKETS)) % HUE_BUCKETS];

    if (
      bucket !== undefined &&
      lightness > DARKEST &&
      lightness < LIGHTEST &&
      saturation > GREYEST
    ) {
      const weight = saturation;

      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;
      bucket.weight += weight;
    }
  }

  const ranked = buckets.toSorted((one, other) => other.weight - one.weight);
  const strongest = ranked[0]?.weight ?? 0;
  const found = ranked
    .filter((bucket) => bucket.weight > 0 && bucket.weight >= strongest * NOTICEABLE)
    .slice(0, count)
    .map(brightened);

  const pool: readonly string[] = found.length > 0 ? found : FALLBACK;

  return Array.from({ length: count }, (_, at) => pool[at % pool.length] ?? FALLBACK[0]);
};

export { dominantColours };
