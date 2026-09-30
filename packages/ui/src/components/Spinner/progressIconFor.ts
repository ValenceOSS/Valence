import {
  CircleDashed as CircleDashedIcon,
  CircleDashedFull as CircleDashedFullIcon,
  CircleDashedHalf as CircleDashedHalfIcon,
  CircleDashedQuarter as CircleDashedQuarterIcon,
  CircleDashedThreeQuarter as CircleDashedThreeQuarterIcon,
} from '@keyline-icons/react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

/**
 * Picks the ring that says how far along something is, a quarter at a time, so progress reads at a
 * glance from how much of the dashed circle has been drawn in.
 *
 * @param progress - How far along, from nothing to done.
 * @returns The icon to draw.
 */
const progressIconFor = (progress: number): IconGlyph => {
  if (progress >= 1) {
    return CircleDashedFullIcon;
  }

  if (progress >= 0.75) {
    return CircleDashedThreeQuarterIcon;
  }

  if (progress >= 0.5) {
    return CircleDashedHalfIcon;
  }

  if (progress >= 0.25) {
    return CircleDashedQuarterIcon;
  }

  return CircleDashedIcon;
};

export { progressIconFor };
