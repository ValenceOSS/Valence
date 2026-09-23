const SIZE = 1024;

const BANDS: readonly (readonly number[])[] = [
  [2, 3, 4, 5],
  [7, 10, 14, 19],
  [26, 36, 50, 70],
  [100, 140, 190, 250],
];

const WINDOW = Array.from(
  { length: SIZE },
  (_, at) => 0.5 - 0.5 * Math.cos((2 * Math.PI * at) / (SIZE - 1)),
);

/**
 * How loud a block of music is in four bands, from the bass to the treble, as a visualiser reads
 * it: the last stretch of samples is windowed, and the strength of a handful of frequencies spread
 * through each band is measured and averaged. At the television's usual rate the bands run up to
 * about 200Hz, 800Hz, 3kHz and 11kHz.
 *
 * @param frames - The samples, from nought either side.
 * @returns How strong each band is, not yet scaled to anything.
 */
const soundBands = (frames: readonly number[]): number[] => {
  const size = Math.min(frames.length, SIZE);
  const from = frames.length - size;

  return BANDS.map((bins) => {
    let total = 0;

    for (const bin of bins) {
      let real = 0;
      let imaginary = 0;
      const step = (2 * Math.PI * bin) / size;

      for (let at = 0; at < size; at += 1) {
        const sample = (frames[from + at] ?? 0) * (WINDOW[Math.floor((at * SIZE) / size)] ?? 1);

        real += sample * Math.cos(step * at);
        imaginary -= sample * Math.sin(step * at);
      }

      total += Math.hypot(real, imaginary);
    }

    return total / bins.length;
  });
};

export { soundBands };
