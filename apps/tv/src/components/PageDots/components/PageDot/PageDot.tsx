import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { PAGE_DOT } from '@ValenceTv/components/PageDots/PAGE_DOT';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { placeOfDot } from '@ValenceTv/components/PageDots/placeOfDot';
import { StretchPill } from '@ValenceTv/components/StretchPill/StretchPill';
import type { PageDotProps } from './PageDot.types';

const HANDS_OVER = {
  duration: 300,
  easing: Easing.inOut(Easing.ease),
  useNativeDriver: true,
};

/**
 * One of the dots beneath the front page's hero: a dot for a turn still to come or already had, and
 * for the turn now a longer pill, easing from one to the other and along the row as the turns hand
 * over.
 *
 * It moves by transforms alone, never a change of size, since laying the screen out again on every
 * frame resets the television's focus guides and leaves the remote unable to move, and Android does
 * not animate a change of layout at all.
 *
 * @param at - Which dot this is, from nought.
 * @param current - Which turn is now, from nought.
 */
const PageDot = ({ at, current }: PageDotProps) => {
  const { x: toX, width: toWidth } = placeOfDot(at, current);
  const [x] = useState(() => new Animated.Value(toX));
  const [width] = useState(() => new Animated.Value(toWidth));
  const isFirst = useRef(true);
  const isStill = useKeepsStill();

  useEffect(() => {
    if (isFirst.current || isStill) {
      x.setValue(toX);
      width.setValue(toWidth);
      isFirst.current = false;

      return;
    }

    Animated.parallel([
      Animated.timing(x, { ...HANDS_OVER, toValue: toX }),
      Animated.timing(width, { ...HANDS_OVER, toValue: toWidth }),
    ]).start();
  }, [isStill, toX, toWidth, x, width]);

  return <StretchPill x={x} width={width} height={PAGE_DOT.size} colour="#ffffff" />;
};

PageDot.displayName = 'PageDot';

export { PageDot };
