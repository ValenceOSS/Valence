import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';

const CODEC_NAMES: Record<string, string> = {
  h264: 'H.264',
  hevc: 'HEVC',
  av1: 'AV1',
  vp9: 'VP9',
  vp8: 'VP8',
  mpeg2: 'MPEG-2',
  mpeg4: 'MPEG-4',
  vc1: 'VC-1',
};

/**
 * What to call a rendition in a list beside the film it came from.
 *
 * Named for what somebody would choose between rather than for how it was made: the rung and the
 * codec are the two facts that decide whether a given device plays it, and a row reading "1080p
 * HEVC" answers that where an identifier does not.
 *
 * The rung is read from the picture rather than from whatever was asked for, so a rendition is
 * labelled by what it turned out to be. Width as well as height, because a film shot in scope fills
 * the width of its class while falling well short of the height — 1920x800 is a 1080p file by any
 * reading a person would give it.
 *
 * @param rendition - The finished file's picture size and codec.
 * @returns What to call it.
 */
const renditionLabel = ({
  width,
  height,
  videoCodec,
}: {
  width: number;
  height: number;
  videoCodec: string;
}): string => {
  const step = QUALITY_STEPS.find(
    (one) => width >= one.maxWidth || height >= one.maxHeight,
  );

  const codec = CODEC_NAMES[videoCodec] ?? videoCodec.toUpperCase();

  return step === undefined ? codec : `${step.label} ${codec}`;
};

export { CODEC_NAMES, renditionLabel };
