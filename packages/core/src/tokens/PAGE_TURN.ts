import { easeInQuad } from '@ValenceCore/functions/easeInQuad';
import { easeOutCubic } from '@ValenceCore/functions/easeOutCubic';

const PAGE_TURN = {
  startsAfter: 12,
  moreAcrossThanDown: 1.5,
  turnsAfter: 40,
  flingPixelsPerMs: 0.3,
  slidesBy: 0.12,
  leaves: { ms: 110, ease: easeInQuad },
  arrives: { ms: 200, ease: easeOutCubic },
  curls: { ms: 360, ease: easeOutCubic, rises: 0.18, acrossAtLeast: 0.5 },
} as const;

export { PAGE_TURN };
