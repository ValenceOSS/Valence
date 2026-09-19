import { efficiencyOf } from '@ValenceCore/functions/encodeBitrateFor';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { frameRateAllowance } from '@ValenceCore/functions/resolveQualityStep';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

type ReencodeBitrate = {
  capKbps: number;
  expectedKbps: number;
};

/**
 * What bitrate a stored re-encode involves: the ceiling it may not exceed, and the figure it is
 * expected to land near.
 *
 * Two numbers rather than one, because storage and streaming want opposite things from a bitrate.
 * A stream is bounded by the line it travels down, so its bitrate is a **target** and the encoder
 * is told to fill it. A file being kept is bounded by nothing, and total size is the outcome rather
 * than the input — so the encoder is left on constant quality and simple content is allowed to come
 * out genuinely smaller instead of padding to a figure. The ceiling is only there so that one
 * pathological scene cannot blow the file out.
 *
 * Which is why the expected figure is scaled for the codec and the ceiling is not. HEVC at matched
 * quality needs about sixty percent of H.264's bits and AV1 about half, so that is what they are
 * expected to spend — and it is the whole reason the codec matters more than the rung. Holding
 * them to a scaled ceiling as well would cap them twice for the same efficiency.
 *
 * Where no rung was chosen — a codec change at the file's own resolution — both figures come from
 * the source instead. Nothing may spend more than the original did, since the detail to spend it
 * on was thrown away by whoever made the file.
 *
 * @param item - The file, as the catalogue holds it.
 * @param quality - The rung chosen, or nothing to keep the file's own picture.
 * @param targetCodec - The codec being encoded to.
 * @returns The ceiling and the figure to quote.
 */
const reencodeBitrateFor = (
  item: MediaItem,
  quality: QualityStepId | null,
  targetCodec: string,
): ReencodeBitrate => {
  const step = quality === null ? undefined : QUALITY_STEPS.find((one) => one.id === quality);
  const relative = efficiencyOf(targetCodec) / efficiencyOf(item.videoCodec);

  if (step === undefined) {
    return {
      capKbps: item.bitrateKbps,
      expectedKbps: Math.max(1, Math.round(Math.min(item.bitrateKbps * relative, item.bitrateKbps))),
    };
  }

  const ceiling = Math.round(
    step.maxVideoBitrateKbps * frameRateAllowance(item.videoFrameRate),
  );

  const capKbps = Math.max(1, Math.min(ceiling, item.bitrateKbps));

  return {
    capKbps,
    expectedKbps: Math.max(1, Math.min(Math.round(ceiling * efficiencyOf(targetCodec)), capKbps)),
  };
};

export type { ReencodeBitrate };

export { reencodeBitrateFor };
