import { audioKbpsOf } from '@ValenceCore/functions/audioKbpsOf';
import { downscaleShare, efficiencyOf } from '@ValenceCore/functions/encodeBitrateFor';
import type { MediaItem, VideoCodec } from '@ValenceContracts/schemas/MediaItem';

const LOWEST_KBPS = 100;

const LEAST_OF_THE_FILE = 0.5;

type LadderBitrateOptions = {
  media: MediaItem;
  targetCodec: VideoCodec;
  maxWidth: number;
  maxHeight: number;
};

/**
 * What a smaller picture of this film is given, worked out from what the film itself spends.
 *
 * A step down the ladder is the source scaled rather than a figure fixed for every film: the video's
 * own bitrate, shrunk the way bits shrink with pixels and grown by what the codec it is sent in
 * needs over the one it came in. A remux at forty megabits and an episode at one and a half get
 * ladders of their own, and neither is given more than its picture is worth.
 *
 * The sound is estimated rather than measured, and a lossless track guessed at its usual rate can
 * come to more than a whole file that was in fact encoded leanly — so the picture is never taken to
 * be less than half of what the file spends.
 *
 * @param options - The film, the codec it is sent in, and the box the picture has to fit.
 * @returns The video bitrate for the step, in kilobits a second.
 */
const ladderBitrateFor = ({
  media,
  targetCodec,
  maxWidth,
  maxHeight,
}: LadderBitrateOptions): number => {
  const sound = media.audioStreams.reduce((total, stream) => total + audioKbpsOf(stream), 0);
  const picture = Math.max(media.bitrateKbps * LEAST_OF_THE_FILE, media.bitrateKbps - sound);
  const byCodec = efficiencyOf(targetCodec) / efficiencyOf(media.videoCodec);
  const share = downscaleShare({
    sourceWidth: media.width,
    sourceHeight: media.height,
    maxWidth,
    maxHeight,
  });

  return Math.max(LOWEST_KBPS, Math.round(picture * byCodec * share));
};

export type { LadderBitrateOptions };

export { ladderBitrateFor };
