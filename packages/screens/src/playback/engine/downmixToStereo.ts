const HALF_POWER = Math.SQRT1_2;

const KNEE = 0.9;

const WEIGHTS: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
  3: [
    [1, 0],
    [0, 1],
    [HALF_POWER, HALF_POWER],
  ],
  4: [
    [1, 0],
    [0, 1],
    [HALF_POWER, 0],
    [0, HALF_POWER],
  ],
  5: [
    [1, 0],
    [0, 1],
    [HALF_POWER, HALF_POWER],
    [HALF_POWER, 0],
    [0, HALF_POWER],
  ],
  6: [
    [1, 0],
    [0, 1],
    [HALF_POWER, HALF_POWER],
    [0, 0],
    [HALF_POWER, 0],
    [0, HALF_POWER],
  ],
  7: [
    [1, 0],
    [0, 1],
    [HALF_POWER, HALF_POWER],
    [0, 0],
    [0.5, 0.5],
    [HALF_POWER, 0],
    [0, HALF_POWER],
  ],
  8: [
    [1, 0],
    [0, 1],
    [HALF_POWER, HALF_POWER],
    [0, 0],
    [HALF_POWER, 0],
    [0, HALF_POWER],
    [HALF_POWER, 0],
    [0, HALF_POWER],
  ],
};

/**
 * Rounds off a sample that would clip, leaving everything below the knee untouched, so a loud
 * moment folded from many channels into two softens rather than cracks.
 *
 * @param value - The sample.
 * @returns The sample, kept within full scale.
 */
const softClip = (value: number): number => {
  const size = Math.abs(value);

  return size <= KNEE
    ? value
    : Math.sign(value) * (KNEE + (1 - KNEE) * Math.tanh((size - KNEE) / (1 - KNEE)));
};

/**
 * Folds surround sound into stereo the way ITU-R BS.775 does: the centre, where the dialogue is,
 * into both sides at half power, each surround into its own side at half power, a single back
 * channel into both at half, and the LFE left out. Channels are read in the order WAVE and FFmpeg
 * give them — front left, front right, centre, LFE, then the backs and sides. Anything already
 * stereo or mono, or a layout with no known order, keeps its first two channels.
 *
 * @param planes - One plane of samples per channel.
 * @returns The left and right planes.
 */
const downmixToStereo = (planes: readonly Float32Array[]): [Float32Array, Float32Array] => {
  const frames = planes[0]?.length ?? 0;
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);
  const weights = WEIGHTS[planes.length];

  if (weights === undefined) {
    left.set(planes[0] ?? left);
    right.set(planes[1] ?? planes[0] ?? right);

    return [left, right];
  }

  planes.forEach((plane, channel) => {
    const [toLeft, toRight] = weights[channel] ?? [0, 0];

    for (let frame = 0; frame < frames; frame += 1) {
      const value = plane[frame] ?? 0;

      left[frame] = (left[frame] ?? 0) + value * toLeft;
      right[frame] = (right[frame] ?? 0) + value * toRight;
    }
  });

  for (let frame = 0; frame < frames; frame += 1) {
    left[frame] = softClip(left[frame] ?? 0);
    right[frame] = softClip(right[frame] ?? 0);
  }

  return [left, right];
};

export { downmixToStereo };
