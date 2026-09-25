import { say } from '@ValenceI18n/say';
import { describePlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

type SessionDelivery = {
  label: string;
  detail: string;
};

const DELIVERIES = {
  DirectPlay: {
    labelKey: 'screens.describeSessionDelivery.directPlayLabel',
    detailKey: 'screens.describeSessionDelivery.directPlayDetail',
  },
  Remux: {
    labelKey: 'screens.describeSessionDelivery.remuxLabel',
    detailKey: 'screens.describeSessionDelivery.remuxDetail',
  },
  DirectStream: {
    labelKey: 'screens.describeSessionDelivery.directStreamLabel',
    detailKey: 'screens.describeSessionDelivery.directStreamDetail',
  },
  Transcode: {
    labelKey: 'screens.describeSessionDelivery.transcodeLabel',
    detailKey: 'screens.describeSessionDelivery.transcodeDetail',
  },
} as const satisfies Record<string, { labelKey: StringKey; detailKey: StringKey }>;

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
): SessionDelivery => {
  const keys = DELIVERIES[describePlaybackMode(playback.plan)];

  return { label: say(keys.labelKey), detail: say(keys.detailKey) };
};

export type { SessionDelivery };

export { describeSessionDelivery };
