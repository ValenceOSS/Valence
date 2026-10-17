import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import { say } from '@ValenceI18n/say';

type SessionDelivery = {
  label: string;
  detail: string;
};

const PLAYBACK_DELIVERIES = {
  DirectPlay: {
    label: 'DirectPlay',
    detail: say('screens.admin.describeSessionDelivery.directPlayTheOriginalFileHanded'),
  },
  Remux: {
    label: say('common.remux'),
    detail: say('screens.admin.describeSessionDelivery.remuxTheOriginalPictureAndSound'),
  },
  DirectStream: {
    label: 'DirectStream',
    detail: say('screens.admin.describeSessionDelivery.directStreamTheOriginalPictureWith'),
  },
  Transcode: {
    label: say('screens.admin.describeSessionDelivery.transcoding'),
    detail: say('screens.admin.describeSessionDelivery.transcodingTheServerIsConvertingThe'),
  },
} as const satisfies Record<PlaybackMode, SessionDelivery>;

export type { SessionDelivery };

export { PLAYBACK_DELIVERIES };
