import {
  Clock as ClockIcon,
  EyeOff as EyeOffIcon,
  Unlink as UnlinkIcon,
} from '@keyline-icons/react';
import { SHARE_ENDING_SAID } from '@ValenceContracts/schemas/Share';
import { say } from '@ValenceI18n/say';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { ShareEnding } from '@ValenceContracts/schemas/Share';

type EndingTold = {
  said: string;
  detail: string;
  icon: IconGlyph;
};

const TOLD: Record<ShareEnding, { detailKey: StringKey; icon: IconGlyph }> = {
  withdrawn: {
    detailKey: 'screens.describeShareEnding.withdrawnDetail',
    icon: UnlinkIcon,
  },
  expired: {
    detailKey: 'screens.describeShareEnding.expiredDetail',
    icon: ClockIcon,
  },
  spent: {
    detailKey: 'screens.describeShareEnding.spentDetail',
    icon: EyeOffIcon,
  },
};

/**
 * Says what a guest should see for a link that has stopped working. The three ways a link can end
 * are three different things to have happened — somebody decided, time passed, or it was opened as
 * often as it was meant to be — and a guest reading one of them is usually working out whether to
 * ask for another link or whether they have simply arrived too late.
 *
 * The sentence itself comes from the contract rather than being written again here, so that a guest
 * and anything else reading the API are told the same thing.
 *
 * A withdrawn link says somebody stopped it rather than naming them. Whoever made a link is not
 * necessarily whoever withdrew it — an administrator may withdraw anybody's — and which of them did
 * is about how the household is run, which is not a guest's business.
 *
 * @param ended - How the link ended.
 * @returns What to show: the sentence, what follows it, and the mark above it.
 */
const describeShareEnding = (ended: ShareEnding): EndingTold => ({
  said: SHARE_ENDING_SAID[ended],
  detail: say(TOLD[ended].detailKey),
  icon: TOLD[ended].icon,
});

export type { EndingTold };

export { describeShareEnding };
