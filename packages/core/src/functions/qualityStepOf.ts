import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';

/**
 * Which quality a picture is, read from its width as well as its height, because a film shot in
 * scope fills the width of its class while falling well short of the height — 1920x800 is a 1080p
 * file by any reading a person would give it.
 *
 * @param picture - The picture's size.
 * @returns Its step, or nothing for a picture smaller than every step.
 */
const qualityStepOf = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): (typeof QUALITY_STEPS)[number] | undefined =>
  QUALITY_STEPS.find((one) => width >= one.maxWidth || height >= one.maxHeight);

export { qualityStepOf };
