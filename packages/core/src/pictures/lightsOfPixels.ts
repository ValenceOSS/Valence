import type { PictureLight } from '@ValenceCore/pictures/PictureLight';

const READ_AT = 48;

const SPREAD = 1.9;

const ACROSS = 6;

const DOWN = 4;

const COLUMNS = Array.from(
  { length: ACROSS },
  (_, at) => Math.round(((at + 0.5) / ACROSS) * 1000) / 10,
);

const ROWS = Array.from({ length: DOWN }, (_, at) => Math.round(((at + 0.5) / DOWN) * 1000) / 10);

const ZONES = ROWS.flatMap((y, row) =>
  COLUMNS.map((x, column) => ({
    from: [
      column / COLUMNS.length,
      row / ROWS.length,
      1 / COLUMNS.length,
      1 / ROWS.length,
    ] as const,
    at: `${x.toString()}% ${y.toString()}%`,
  })),
);

const VIVID_FROM = 0.12;

const VIVID_FULL = 0.5;

const BRIGHT_FULL = 40;

const LIFT_TO = 170;

/**
 * Says how strongly a colour should light the page, by how saturated it is: fully for a vivid one,
 * not at all for a grey, and fading out only for something close to black, so a dark but coloured
 * picture still lights the page in its colour while a black one leaves it dark.
 *
 * @param red - Its red, from nothing to 255.
 * @param green - Its green, from nothing to 255.
 * @param blue - Its blue, from nothing to 255.
 * @returns How strongly it shines, from nothing to one.
 */
const vividnessOf = (red: number, green: number, blue: number): number => {
  const peak = Math.max(red, green, blue);
  const floor = Math.min(red, green, blue);
  const saturation = peak === 0 ? 0 : (peak - floor) / peak;
  const vivid = Math.min(Math.max((saturation - VIVID_FROM) / (VIVID_FULL - VIVID_FROM), 0), 1);

  return Math.round(vivid * Math.min(peak / BRIGHT_FULL, 1) * 100) / 100;
};

/**
 * Reads the colours that stand for a picture from a small square copy of it, one for each cell of
 * a grid laid over it, six across and four down, so a page is lit by what is where in the picture
 * rather than by a handful of averages. Each cell's average is pushed away from grey, shines as
 * strongly as it is vivid, and where it is vivid but reads dark is brought up to a visible
 * brightness keeping its hue, so a dark picture still lights the page in its colours while its
 * greys and blacks leave it alone. The web and the phone both read their pictures through this.
 *
 * @param pixels - The small copy's pixels, four values to each, red, green, blue and alpha, row by
 *   row from the top left.
 * @param side - How many pixels wide and tall the copy is.
 * @returns A light for each cell, with where it belongs on the page.
 */
const lightsOfPixels = (pixels: ArrayLike<number>, side: number): PictureLight[] => {
  const lights: PictureLight[] = [];

  for (const zone of ZONES) {
    const [left, top, width, height] = zone.from;
    const fromX = Math.floor(left * side);
    const fromY = Math.floor(top * side);
    const across = Math.max(1, Math.floor(width * side));
    const down = Math.max(1, Math.floor(height * side));

    let red = 0;
    let green = 0;
    let blue = 0;
    let counted = 0;

    for (let y = fromY; y < fromY + down; y += 1) {
      for (let x = fromX; x < fromX + across; x += 1) {
        const at = (y * side + x) * 4;
        const isInside = x < side && y < side;

        red += isInside ? (pixels[at] ?? 0) : 0;
        green += isInside ? (pixels[at + 1] ?? 0) : 0;
        blue += isInside ? (pixels[at + 2] ?? 0) : 0;
        counted += 1;
      }
    }

    const average = (red + green + blue) / (counted * 3);
    const lift = (channel: number): number =>
      Math.max(0, Math.min(255, Math.round(average + (channel / counted - average) * SPREAD)));

    const read = [lift(red), lift(green), lift(blue)];
    const weight = vividnessOf(read[0] ?? 0, read[1] ?? 0, read[2] ?? 0);
    const peak = Math.max(...read);
    const raise = weight > 0 && peak > 0 && peak < LIFT_TO ? LIFT_TO / peak : 1;
    const [litRed = 0, litGreen = 0, litBlue = 0] = read.map((channel) =>
      Math.min(255, Math.round(channel * raise)),
    );

    lights.push({
      at: zone.at,
      color: `rgb(${litRed.toString()} ${litGreen.toString()} ${litBlue.toString()})`,
      weight,
    });
  }

  return lights;
};

export { lightsOfPixels, READ_AT, ZONES };
