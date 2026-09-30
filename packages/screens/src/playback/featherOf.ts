const FEATHER = '3rem';

/**
 * Writes a mask that fades a picture out towards two opposite edges, so it melts into the light
 * around it rather than stopping at a hard line. The fade starts where the picture shown starts, past
 * any black the film carries that is cropped away.
 *
 * @param towards - Which way the gradient runs: across for the sides, down for the top and bottom.
 * @param cropped - How much of each end is cropped away, as a percentage of the whole.
 * @returns A CSS gradient to use as one layer of a mask.
 */
const featherOf = (towards: 'right' | 'bottom', cropped: number): string => {
  const start = `${cropped.toString()}%`;
  const end = `${(100 - cropped).toString()}%`;

  return `linear-gradient(to ${towards}, transparent ${start}, black calc(${start} + ${FEATHER}), black calc(${end} - ${FEATHER}), transparent ${end})`;
};

export { featherOf };
