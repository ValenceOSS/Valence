type Row = [number, number, number];

type Matrix = [Row, Row, Row];

/**
 * The colour matrix CSS draws saturate() and then hue-rotate() with, as one, so a picture made more
 * or less colourful and swung round the colour wheel here comes out as a browser previewed it.
 *
 * @param saturate - How colourful: none is grey, one leaves it as it is.
 * @param hueRotate - How far round the colour wheel, in degrees.
 * @returns The matrix, row by row for red, green and blue.
 */
const colourMatrix = (saturate: number, hueRotate: number): Matrix => {
  const s = saturate;
  const turn = (hueRotate * Math.PI) / 180;
  const c = Math.cos(turn);
  const n = Math.sin(turn);
  const [r, g, b]: Matrix = [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
  const times = ([x, y, z]: Row): Row => [
    x * r[0] + y * g[0] + z * b[0],
    x * r[1] + y * g[1] + z * b[1],
    x * r[2] + y * g[2] + z * b[2],
  ];

  return [
    times([
      0.213 + c * 0.787 - n * 0.213,
      0.715 - c * 0.715 - n * 0.715,
      0.072 - c * 0.072 + n * 0.928,
    ]),
    times([
      0.213 - c * 0.213 + n * 0.143,
      0.715 + c * 0.285 + n * 0.14,
      0.072 - c * 0.072 - n * 0.283,
    ]),
    times([
      0.213 - c * 0.213 - n * 0.787,
      0.715 - c * 0.715 + n * 0.715,
      0.072 + c * 0.928 + n * 0.072,
    ]),
  ];
};

export { colourMatrix };
