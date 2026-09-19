import { naturalAudioStreamIndex } from '@ValenceCore/functions/naturalAudioStreamIndex';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const CONTAINERS_THAT_CARRY_A_CODEC_TAG = ['mp4', 'mov'];

const HEVC_TAG_A_PLAYER_WILL_TAKE = 'hvc1';

const H264_TAG_A_PLAYER_MAY_REFUSE = 'avc3';

/**
 * Whether a stream can be handed to a player as it is, as far as its codec tag is concerned.
 *
 * A video stream in an ISO base media file is marked with a four-letter tag, and for two codecs
 * that tag says where the parameter sets live — the few bytes a decoder reads before it can decode
 * anything. Out of band, in the configuration record, and any player can start. In band, carried
 * in the stream, and some players will not look: Safari refuses outright and Chromium draws
 * nothing, so a perfectly good copy arrives as sound over a black picture.
 *
 * HEVC is `hvc1` out of band and `hev1` in band, and it is refused unless it says `hvc1`. FFmpeg
 * writes `hev1` unasked, so in-band is the common case and an unknown tag is far more likely to be
 * the bad one than the good one.
 *
 * H.264 is `avc1` out of band and `avc3` in band, and it is refused only where it actually says
 * `avc3`. The defaults run the other way round: FFmpeg writes `avc1`, almost nothing writes `avc3`,
 * and Valence has handed H.264 over untouched since the beginning without trouble. Refusing an
 * unknown tag here would put an entire library of H.264 through a session until every file had
 * been probed again, to catch a case that is rare — so this one fails open where HEVC fails shut.
 *
 * Only the ISO base media family has such a field, and here that is MP4 and QuickTime. Matroska
 * stores its codecs with the parameter sets in `CodecPrivate`, so there is no tag to get wrong and
 * nothing to check — which is most of a remux library, and all of it was being sent through a
 * session to fix a tag that was never there.
 *
 * @param item - The file being weighed.
 * @returns Whether its picture can be handed over untouched.
 */
const mayBeHandedOver = (item: MediaItem): boolean => {
  if (!CONTAINERS_THAT_CARRY_A_CODEC_TAG.includes(item.container)) {
    return true;
  }

  if (item.videoCodec === 'hevc') {
    return item.videoCodecTag === HEVC_TAG_A_PLAYER_WILL_TAKE;
  }

  return item.videoCodecTag !== H264_TAG_A_PLAYER_MAY_REFUSE;
};

/**
 * Whether a plan amounts to handing over the file untouched — nothing remuxed, nothing re-encoded,
 * the track the player would have chosen anyway, and no subtitles burned in. Anything less counts as
 * the server doing work, and is worth saying so, because direct play is the only mode that costs
 * nothing to serve.
 *
 * A file whose codec tag would stop a player decoding it does not count either, whatever the rest
 * of the plan says: it goes through a session, which copies the picture and marks it properly on
 * the way out. Valence used to refuse every HEVC file on the grounds that it could not tell `hvc1`
 * from `hev1` — true of the catalogue and false of the file, since ffprobe had been reporting the
 * tag all along.
 *
 * @param plan - What the negotiator decided.
 * @param item - The file it decided about.
 * @returns Whether the file is being handed over as it is.
 */
const isDirectPlay = (plan: PlaybackPlan, item: MediaItem): boolean =>
  plan.container.kind === 'passthrough' &&
  plan.video.kind === 'passthrough' &&
  plan.audio.kind === 'passthrough' &&
  plan.audio.streamIndex === naturalAudioStreamIndex(item.audioStreams) &&
  plan.subtitles.kind !== 'burnIn' &&
  mayBeHandedOver(item);

export { isDirectPlay };
