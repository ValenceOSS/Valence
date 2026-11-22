import type { Converted } from '@ValenceContracts/schemas/Converted';
import type { PlaybackStartReason } from '@ValenceContracts/schemas/PlaybackStartReason';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';

type Asked = {
  mediaId: string;
  audioStreamIndex: number | undefined;
  audioLanguage: string | undefined;
  requestedQuality: QualityPreference | undefined;
  converted: Converted | undefined;
  attempt: number;
};

/**
 * Works out why the television is asking for a stream, from what changed since it last asked,
 * for the server's log.
 *
 * @param before - What it asked for last time, or nothing where it has not asked yet.
 * @param now - What it is asking for now.
 * @returns Why it is asking.
 */
const whyItAsksAgain = (before: Asked | null, now: Asked): PlaybackStartReason => {
  if (before === null || before.mediaId !== now.mediaId) {
    return 'opened';
  }

  if (before.converted !== now.converted) {
    return 'converting';
  }

  if (before.attempt !== now.attempt) {
    return 'retried';
  }

  if (
    before.audioStreamIndex !== now.audioStreamIndex ||
    before.audioLanguage !== now.audioLanguage
  ) {
    return 'audio';
  }

  if (before.requestedQuality !== now.requestedQuality) {
    return 'quality';
  }

  return 'opened';
};

export type { Asked };

export { whyItAsksAgain };
