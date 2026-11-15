import { describe, expect, it } from 'vitest';
import { lightsOfPixels, READ_AT, ZONES } from './lightsOfPixels';

const QUARTERS = {
  topLeft: [220, 30, 30],
  topRight: [30, 200, 30],
  bottomLeft: [30, 30, 220],
  bottomRight: [240, 240, 240],
} as const;

/**
 * A small square picture divided into quarters, red, green, blue and white.
 *
 * @param side - How many pixels wide and tall it is.
 * @returns Its pixels, four values to each.
 */
const quartered = (side: number): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(side * side * 4);

  for (let y = 0; y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      const colour =
        y < side / 2
          ? x < side / 2
            ? QUARTERS.topLeft
            : QUARTERS.topRight
          : x < side / 2
            ? QUARTERS.bottomLeft
            : QUARTERS.bottomRight;
      const at = (y * side + x) * 4;

      pixels.set([...colour, 255], at);
    }
  }

  return pixels;
};

/**
 * A small square picture all of one colour.
 *
 * @param colour - Its red, green and blue.
 * @returns Its pixels, four values to each.
 */
const plain = (colour: readonly [number, number, number]): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(READ_AT * READ_AT * 4);

  for (let at = 0; at < pixels.length; at += 4) {
    pixels.set([...colour, 255], at);
  }

  return pixels;
};

/**
 * The red, green and blue a light was read as.
 *
 * @param color - The light's colour, as `rgb(…)`.
 * @returns Its channels.
 */
const channelsOf = (color: string | undefined): number[] =>
  (color?.match(/\d+/g) ?? []).map(Number);

describe('lightsOfPixels', () => {
  it('reads a picture as a grid six across and four down, each light where its cell is', () => {
    const lights = lightsOfPixels(quartered(READ_AT), READ_AT);

    expect(lights).toHaveLength(24);
    expect(ZONES[0]?.from).toEqual([0, 0, 1 / 6, 0.25]);
    expect(lights.map((light) => light.at)).toEqual(ZONES.map((zone) => zone.at));
    expect(new Set(lights.map((light) => light.at)).size).toBe(24);
  });

  it('reads every corner of the picture in its own colour', () => {
    const lights = lightsOfPixels(quartered(READ_AT), READ_AT);
    const [red = 0, green = 0, blue = 0] = channelsOf(lights[0]?.color);
    const [, topRightGreen = 0, topRightBlue = 0] = channelsOf(lights[5]?.color);
    const [, , bottomLeftBlue = 0] = channelsOf(lights[18]?.color);

    expect(red).toBeGreaterThan(green);
    expect(red).toBeGreaterThan(blue);
    expect(topRightGreen).toBeGreaterThan(topRightBlue);
    expect(bottomLeftBlue).toBeGreaterThan(200);
  });

  it('lets a vivid colour shine and keeps white from lighting the page', () => {
    const lights = lightsOfPixels(quartered(READ_AT), READ_AT);

    expect(lights[0]?.weight).toBe(1);
    expect(lights[23]?.weight).toBe(0);
  });

  it('pushes a muted colour further from grey than it was', () => {
    const [light] = lightsOfPixels(plain([150, 110, 100]), READ_AT);

    expect(channelsOf(light?.color)).toEqual([177, 101, 82]);
  });

  it('brings a dark but coloured picture up to a colour worth lighting a page with', () => {
    const [light] = lightsOfPixels(plain([60, 10, 10]), READ_AT);
    const [red = 0, green = 0] = channelsOf(light?.color);

    expect(red).toBe(170);
    expect(green).toBe(0);
    expect(light?.weight).toBe(1);
  });

  it('leaves a black picture dark and unlit', () => {
    const [light] = lightsOfPixels(plain([0, 0, 0]), READ_AT);

    expect(light).toEqual({ at: ZONES[0]?.at, color: 'rgb(0 0 0)', weight: 0 });
  });

  it('reads a picture of another size', () => {
    const lights = lightsOfPixels(quartered(5), 5);

    expect(lights).toHaveLength(24);
    expect(channelsOf(lights[0]?.color)[0]).toBeGreaterThan(channelsOf(lights[0]?.color)[1] ?? 0);
  });

  it('reads missing pixels as dark rather than failing', () => {
    expect(lightsOfPixels([], READ_AT).every((light) => light.weight === 0)).toBe(true);
    expect(lightsOfPixels([], 0).every((light) => light.color === 'rgb(0 0 0)')).toBe(true);
  });
});
