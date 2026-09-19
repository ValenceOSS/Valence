import { naturalAudioStreamIndex } from '@ValenceCore/functions/naturalAudioStreamIndex';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';

/**
 * Whether a plan amounts to handing over the file untouched — nothing remuxed, nothing re-encoded,
 * the track the player would have chosen anyway, and no subtitles burned in. Anything less counts as
 * the server doing work, and is worth saying so, because direct play is the only mode that costs
 * nothing to serve.
 *
 * HEVC never qualifies, whatever the plan says. An HEVC stream in MP4 is marked either `hvc1` or
 * `hev1`, the marking decides whether a player will decode it, and Valence does not know which a given
 * file carries — the catalogue records the codec and not the tag it was written with. Sending it
 * through a session instead costs a copy, which is close to nothing, and the session marks it
 * `hvc1` on the way out. So the tag is right on every path rather than on the paths that happen to
 * re-wrap it.
 *
 * That is stricter than Jellyfin, which serves HEVC statically and retags only what it remuxes. The
 * difference is a file Valence copies where Jellyfin would not, against a black picture on any player
 * that reads the tag strictly. Worth revisiting if the catalogue ever learns the tag.
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
  item.videoCodec !== 'hevc';

export { isDirectPlay };
