import type { Converted } from '@ValenceContracts/schemas/Converted';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const MEDIA = 3;

const QUOTA_EXCEEDED = 3017;

/**
 * What to ask the server to convert after a stream failed to decode, the way Jellyfin retries: the
 * picture first, then the sound as well, then nothing more. A copy of a file a device should play
 * can still hold something its decoder refuses, such as a stretch of a download that was never
 * written, which the server's encoder reads past. Only a decoding failure is retried, since
 * converting does nothing for a network that dropped or a buffer that filled.
 *
 * @param options - The plan that failed, what was already converted, and the engine's fault, or
 *   nothing where the element itself refused the stream.
 * @returns What to convert on the next try, or nothing where converting more would not help.
 */
const whatToConvertNext = ({
  plan,
  converted,
  fault,
}: {
  plan: {
    video: Pick<PlaybackPlan['video'], 'kind'>;
    audio: Pick<PlaybackPlan['audio'], 'kind'>;
  };
  converted: Converted | undefined;
  fault: { category: number; code?: number } | null;
}): Converted | null => {
  if (fault !== null && (fault.category !== MEDIA || fault.code === QUOTA_EXCEEDED)) {
    return null;
  }

  if (converted === undefined && plan.video.kind === 'passthrough') {
    return 'picture';
  }

  if (converted !== 'pictureAndSound' && plan.audio.kind === 'passthrough') {
    return 'pictureAndSound';
  }

  return null;
};

export { whatToConvertNext };
