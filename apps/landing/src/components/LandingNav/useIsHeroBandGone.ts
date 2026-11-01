import { useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { VALENCE_BAND_ID } from '@ValenceLanding/components/HomePage/components/ValenceBand/VALENCE_BAND_ID';

/**
 * Follows whether the hero's band has scrolled up out of sight, so the bar can carry it instead.
 *
 * @returns Whether the band is above the top of the window.
 */
const useIsHeroBandGone = (): boolean => {
  const { scrollY } = useScroll();
  const [isGone, setIsGone] = useState(false);

  useMotionValueEvent(scrollY, 'change', () => {
    const band = document.getElementById(VALENCE_BAND_ID);

    setIsGone(band !== null && band.getBoundingClientRect().bottom < 0);
  });

  return isGone;
};

export { useIsHeroBandGone };
