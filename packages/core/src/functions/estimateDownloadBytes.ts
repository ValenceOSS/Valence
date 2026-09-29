import { audioKbpsOf } from '@ValenceCore/functions/audioKbpsOf';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const BITS_IN_A_KILOBIT = 1000;

const BITS_IN_A_BYTE = 8;

type EstimateDownloadBytesOptions = {
  plan: PlaybackPlan;
  source: MediaItem;
  sizeBytes: number;
};

/**
 * How large a download made to this plan would be, in bytes.
 *
 * Read from the plan the file is actually made to, so the figure follows every decision the encode
 * does: a source already small enough is copied and costs its own size, and an encode costs the
 * bitrate it is given. That bitrate is a ceiling the encoder may come in under, so the figure leans
 * high, which is the direction to be wrong in: somebody told four gigabytes who receives three is
 * pleased, and somebody told three who receives four has hit the exact problem the figure exists
 * to prevent.
 *
 * @param options - The plan, the file it is made from, and how large that file is.
 * @returns The size in bytes, or nothing where there is nothing to estimate from.
 */
const estimateDownloadBytes = ({
  plan,
  source,
  sizeBytes,
}: EstimateDownloadBytesOptions): number | null => {
  const { video, audio } = plan;

  if (video.kind === 'passthrough' && audio.kind === 'passthrough') {
    return sizeBytes > 0 ? sizeBytes : null;
  }

  if (!Number.isFinite(source.durationSeconds) || source.durationSeconds <= 0) {
    return null;
  }

  const carried =
    source.audioStreams.find((stream) => stream.index === audio.streamIndex) ??
    source.audioStreams[0];
  const everyTrack = source.audioStreams.reduce((total, stream) => total + audioKbpsOf(stream), 0);

  const audioKbps =
    audio.kind === 'transcode'
      ? audio.maxBitrateKbps
      : carried === undefined
        ? 0
        : audioKbpsOf(carried);
  const videoKbps =
    video.kind === 'transcode'
      ? video.maxBitrateKbps
      : Math.max(0, source.bitrateKbps - everyTrack);

  return Math.round(
    ((videoKbps + audioKbps) * BITS_IN_A_KILOBIT * source.durationSeconds) / BITS_IN_A_BYTE,
  );
};

export type { EstimateDownloadBytesOptions };

export { estimateDownloadBytes };
