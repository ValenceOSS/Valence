import { naturalAudioStreamIndex } from '@ValenceCore/functions/naturalAudioStreamIndex';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

const CONTAINERS_THAT_CARRY_A_CODEC_TAG = ['mp4', 'mov'];

const HEVC_TAG_A_PLAYER_WILL_TAKE = 'hvc1';

/**
 * Whether an HEVC stream can be handed to a player as it is.
 *
 * An HEVC stream in an ISO base media file is marked either `hvc1` or `hev1`, and the marking
 * decides whether a player will decode it. `hvc1` keeps the parameter sets in the configuration
 * record, which is where a decoder looks before it decodes anything. `hev1` allows them in the
 * stream instead: Safari refuses it outright and Chromium draws nothing from it, so a perfectly
 * good copy arrives as sound over a black picture. FFmpeg writes `hev1` unasked, which is why a
 * session retags on the way out.
 *
 * Only the ISO base media family has such a field, and here that is MP4 and QuickTime. Matroska
 * stores HEVC as `V_MPEGH/ISO/HEVC` with the parameter sets in CodecPrivate, so there is no tag to
 * get wrong and nothing to check — which is most of a remux library, and all of it was being sent
 * through a session to fix a tag that was never there.
 *
 * An MP4 whose tag is not known is refused, and that is the point of refusing rather than assuming:
 * a file probed before Valence read the tag holds no answer, and no answer is not the same as `hvc1`.
 * The next scan re-probes it, because the probe version moved.
 *
 * @param item - The file being weighed.
 * @returns Whether its picture can be handed over untouched.
 */
const hevcMayBeHandedOver = (item: MediaItem): boolean =>
  !CONTAINERS_THAT_CARRY_A_CODEC_TAG.includes(item.container) ||
  item.videoCodecTag === HEVC_TAG_A_PLAYER_WILL_TAKE;

/**
 * Whether a plan amounts to handing over the file untouched — nothing remuxed, nothing re-encoded,
 * the track the player would have chosen anyway, and no subtitles burned in. Anything less counts as
 * the server doing work, and is worth saying so, because direct play is the only mode that costs
 * nothing to serve.
 *
 * HEVC qualifies where the file says it may, which is the codec tag above. Valence used to refuse
 * every HEVC file outright on the grounds that it could not tell `hvc1` from `hev1` — true of the
 * catalogue and false of the file, since ffprobe had been reporting the tag all along.
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
  (item.videoCodec !== 'hevc' || hevcMayBeHandedOver(item));

export { isDirectPlay };
