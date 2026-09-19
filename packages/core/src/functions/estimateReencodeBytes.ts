import { audioKbpsOf } from '@ValenceCore/functions/audioKbpsOf';
import { planReencode } from '@ValenceCore/functions/planReencode';
import { reencodeBitrateFor } from '@ValenceCore/functions/reencodeBitrateFor';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

const BITS_IN_A_KILOBIT = 1000;

const BITS_IN_A_BYTE = 8;

/**
 * How many bytes a stream at this bitrate takes over this runtime.
 *
 * @param kbps - The bitrate.
 * @param durationSeconds - How long it runs.
 * @returns The size in bytes.
 */
const bytesFor = (kbps: number, durationSeconds: number): number =>
  Math.round((kbps * BITS_IN_A_KILOBIT * durationSeconds) / BITS_IN_A_BYTE);

/**
 * How large a re-encode would turn out, in bytes.
 *
 * "70 GB → about 6 GB" is the entire pitch, and it has to be on screen before anybody presses
 * anything. The video half comes from what the encode is expected to spend rather than from the
 * ceiling it may not exceed, so a more efficient codec quotes smaller — which is the difference
 * somebody is choosing between. The audio half is summed track by track, which is what makes
 * audio-only work quotable at all.
 *
 * Where the video is being copied the source's own video bytes are kept, worked out by taking the
 * audio off the file's measured size. That is the honest way round: the file's size is a fact and
 * the audio is the estimate, so the estimate is applied to the part nobody can measure.
 *
 * @param item - The file, as the catalogue holds it.
 * @param settings - What was chosen.
 * @returns The size in bytes, or nothing where the file says too little to judge.
 */
const estimateReencodeBytes = (item: MediaItem, settings: ReencodeSettings): number | null => {
  const { durationSeconds, sizeBytes } = item;

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null;
  }

  const plan = planReencode(item, settings);

  const audioNow = item.audioStreams.reduce(
    (total, stream) => total + bytesFor(audioKbpsOf(stream), durationSeconds),
    0,
  );

  const audioAfter = plan.audioTracks.reduce((total, track, at) => {
    const stream = item.audioStreams[at];

    if (stream === undefined) {
      return total;
    }

    return (
      total +
      bytesFor(track.kind === 'encode' ? track.maxBitrateKbps : audioKbpsOf(stream), durationSeconds)
    );
  }, 0);

  if (plan.video.kind === 'encode') {
    const { expectedKbps } = reencodeBitrateFor(item, settings.quality, plan.video.codec);

    return bytesFor(expectedKbps, durationSeconds) + audioAfter;
  }

  if (typeof sizeBytes !== 'number' || sizeBytes <= 0) {
    return null;
  }

  return Math.max(0, Math.round(sizeBytes - audioNow)) + audioAfter;
};

export { estimateReencodeBytes };
