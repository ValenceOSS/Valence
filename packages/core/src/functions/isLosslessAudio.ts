import { LOSSLESS_KBPS_PER_CHANNEL } from '@ValenceCore/functions/audioKbpsOf';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

/**
 * Whether a track is stored losslessly, and so is both large and worth compressing.
 *
 * A lossless TrueHD or DTS-HD track is often a large share of a remux, which is what makes
 * compressing the audio alone a real saving without touching a frame of video.
 *
 * @param stream - The track.
 * @returns Whether nothing has been discarded from it yet.
 */
const isLosslessAudio = (stream: AudioStream): boolean =>
  stream.codec in LOSSLESS_KBPS_PER_CHANNEL;

export { isLosslessAudio };
