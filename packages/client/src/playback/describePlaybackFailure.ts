import { z } from 'zod';
import { say } from '@ValenceI18n/say';

const NETWORK = 1;
const MEDIA = 3;
const MANIFEST = 4;
const STREAMING = 5;

const PlaybackEngineErrorSchema = z.object({
  category: z.number().int(),
});

/**
 * Says what went wrong in terms a viewer can act on — the network, the file, the server — without
 * claiming more than the engine actually reported. A wrong explanation is worse than a vague one:
 * somebody told their connection is at fault will go and restart a router that was working.
 *
 * Everything that is not a decode failure says only that the stream did not load, because that is
 * all that is known. It used to add that the server may have failed to convert the file, which sent
 * somebody hunting a transcode that had in fact finished perfectly: a guest was being refused the
 * segments, and the player cannot tell a refusal from a conversion that never happened. The two
 * engines do not even agree on what the numbers mean — these are shaka's categories and the media
 * element's own error codes, mapped onto the same few integers — so naming a cause is guesswork
 * dressed as a diagnosis.
 *
 * @param category - The engine's own category for the failure.
 * @returns What to tell the viewer.
 */
const describePlaybackFailure = (category: number | null): string => {
  if (category === MEDIA) {
    return say('client.describePlaybackFailure.decode');
  }

  if (category === NETWORK || category === MANIFEST || category === STREAMING) {
    return say('client.describePlaybackFailure.load');
  }

  return say('client.describePlaybackFailure.play');
};

export { describePlaybackFailure, PlaybackEngineErrorSchema };
