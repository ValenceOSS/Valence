import { describePlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import { PLAYBACK_DELIVERIES } from './PLAYBACK_DELIVERIES';
import type { SessionDelivery } from './PLAYBACK_DELIVERIES';

/**
 * How a session is being served, and what that costs the box.
 *
 * Four answers rather than two. The card used to badge anything delivered as a stream as
 * "Transcoding", which put a remux — a container copy that barely touches the processor — beside a
 * full re-encode and made them look alike. An administrator reading four of those has no way to
 * tell a busy server from an idle one, which is the one thing the screen is for.
 *
 * The word carries it, rather than a colour. The badges on a session card are deliberately one
 * tone, so naming each of the four is what tells them apart.
 *
 * @param playback - What the session is playing.
 * @returns What to call it, and the longer sentence for a dialog.
 */
const describeSessionDelivery = (
  playback: NonNullable<ActiveSession['playback']>,
): SessionDelivery => PLAYBACK_DELIVERIES[describePlaybackMode(playback.plan)];

export type { SessionDelivery };

export { describeSessionDelivery };
