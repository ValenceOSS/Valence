import { naturalAudioStreamIndex } from '@ValenceCore/functions/naturalAudioStreamIndex';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const STREAMED_IN = 'mp4';

/**
 * Whether the media element can play the stream a plan sends, judged by the codecs it claims to
 * stream in MP4, so a stream carrying a picture or sound only Valence's own player could decode is
 * caught before it is handed to an element that will refuse it.
 *
 * @param profile - What the media element plays by itself.
 * @param plan - What the server decided to send.
 * @param film - The file the plan was made for.
 * @returns Whether the element takes it, and yes where the plan was made for another copy of the film.
 */
const isStreamedNatively = (
  profile: DeviceProfile,
  plan: PlaybackPlan,
  film: Pick<MediaItem, 'id' | 'videoCodec' | 'audioStreams'>,
): boolean => {
  if (plan.mediaId !== film.id) {
    return true;
  }

  const videoCodec = plan.video.kind === 'transcode' ? plan.video.codec : film.videoCodec;
  const heard =
    plan.audio.kind === 'transcode'
      ? null
      : (plan.audio.streamIndex ?? naturalAudioStreamIndex(film.audioStreams));
  const audioCodec =
    plan.audio.kind === 'transcode'
      ? plan.audio.codec
      : (film.audioStreams.find((stream) => stream.index === heard)?.codec ?? null);

  return profile.directPlayProfiles.some(
    (entry) =>
      entry.container === STREAMED_IN &&
      entry.videoCodecs.includes(videoCodec) &&
      (audioCodec === null || entry.audioCodecs.includes(audioCodec)),
  );
};

export { isStreamedNatively };
