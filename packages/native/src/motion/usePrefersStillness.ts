import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Whether somebody has asked their phone or television to cut down on motion, as the web asks the browser, so a
 * screen can let things simply appear instead of flying into place.
 *
 * It starts by assuming motion is fine, since the answer arrives a moment after the screen does,
 * and follows the setting if it is changed while the screen is up, except in a browser, where React
 * Native offers no way to follow it and the answer is read once.
 *
 * @returns Whether to keep still.
 */
const usePrefersStillness = (): boolean => {
  const [isStill, setIsStill] = useState(false);

  useEffect(() => {
    let isGone = false;

    void AccessibilityInfo.isReduceMotionEnabled().then((still) => {
      if (!isGone) {
        setIsStill(still);
      }
    });

    if (Platform.OS === 'web') {
      return () => {
        isGone = true;
      };
    }

    const listening = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsStill);

    return () => {
      isGone = true;
      listening.remove();
    };
  }, []);

  return isStill;
};

export { usePrefersStillness };
