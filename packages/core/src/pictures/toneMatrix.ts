import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

const RED = 0.213;

const GREEN = 0.715;

const BLUE = 0.072;

/**
 * Multiplies two three-by-three colour matrices, the second applied first.
 *
 * @param after - The one applied second.
 * @param before - The one applied first.
 * @returns The two as one.
 */
const both = (after: number[][], before: number[][]): number[][] =>
  after.map((row) =>
    [0, 1, 2].map((column) =>
      row.reduce((sum, value, at) => sum + value * (before[at]?.[column] ?? 0), 0),
    ),
  );

/**
 * A tone's colour adjustments as one colour matrix, in the order and by the formulas a browser
 * applies `saturate`, `hue-rotate`, `contrast` and `brightness`, so a picture drawn through it looks
 * as the web draws it and as the server bakes it. Rows of five, red then green, blue and alpha, the
 * last of each the amount added, as a share of full brightness.
 *
 * @param tone - The tone, whose overlaid colour is drawn separately.
 * @returns The twenty numbers of the matrix.
 */
const toneMatrix = (tone: PictureTone): number[] => {
  const s = tone.saturate;
  const saturating = [
    [RED + (1 - RED) * s, GREEN - GREEN * s, BLUE - BLUE * s],
    [RED - RED * s, GREEN + (1 - GREEN) * s, BLUE - BLUE * s],
    [RED - RED * s, GREEN - GREEN * s, BLUE + (1 - BLUE) * s],
  ];
  const angle = (tone.hueRotate * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const turning = [
    [
      RED + cos * (1 - RED) - sin * RED,
      GREEN - cos * GREEN - sin * GREEN,
      BLUE - cos * BLUE + sin * (1 - BLUE),
    ],
    [
      RED - cos * RED + sin * 0.143,
      GREEN + cos * (1 - GREEN) + sin * 0.14,
      BLUE - cos * BLUE - sin * 0.283,
    ],
    [
      RED - cos * RED - sin * (1 - RED),
      GREEN - cos * GREEN + sin * GREEN,
      BLUE + cos * (1 - BLUE) + sin * BLUE,
    ],
  ];
  const scale = tone.contrast * tone.brightness;
  const lift = ((1 - tone.contrast) / 2) * tone.brightness;
  const colours = both(turning, saturating);

  return [
    ...colours.flatMap((row) => [...row.map((value) => value * scale), 0, lift]),
    0,
    0,
    0,
    1,
    0,
  ];
};

export { toneMatrix };
