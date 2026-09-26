import { memo, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { ASoftFocus } from '@ValenceMobile/components/ASoftFocus/ASoftFocus';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import type { ALyricLineProps } from './ALyricLine.types';

const SETTLES = { ...SPRINGS.liquid, overshootClamping: true, useNativeDriver: true } as const;

const LIGHTS = { duration: 320, easing: EASINGS.outCubic, useNativeDriver: true } as const;

const BLUR_FOR_SMALLER_WORDS = 0.5;

const FROM_THE_LEFT = { transformOrigin: 'left center' } as const;

/**
 * One line of a song's words, standing as the web's immersive words do: the line being sung full
 * size, bright and sharp, and the rest eased back, dimmed, and further out of focus the further
 * they are from it — half as far out as the web's, whose words are twice the size. It moves from one standing to the next rather than jumping; somebody who has
 * asked for less movement sees it brighten and dim with nothing growing or blurring. It is drawn
 * again only when how it stands changes, so the lines far from the one being sung, which all stand
 * the same, are left alone as the song moves on.
 *
 * @param words - What the line says.
 * @param standing - How it stands against the line being sung.
 * @param isStill - Whether somebody has asked for less movement.
 */
const OneLine = ({ words, standing, isStill }: ALyricLineProps) => {
  const [opacity] = useState(() => new Animated.Value(standing.opacity));
  const [scale] = useState(() => new Animated.Value(isStill ? 1 : standing.scale));

  useEffect(() => {
    Animated.timing(opacity, { ...LIGHTS, toValue: standing.opacity }).start();

    if (isStill) {
      scale.setValue(1);

      return;
    }

    Animated.spring(scale, { ...SETTLES, toValue: standing.scale }).start();
  }, [standing.opacity, standing.scale, isStill, opacity, scale]);

  return (
    <Animated.View style={[FROM_THE_LEFT, { opacity, transform: [{ scale }] }]}>
      <ASoftFocus radius={isStill ? 0 : standing.blur * BLUR_FOR_SMALLER_WORDS}>
        <Words size="title">{words}</Words>
      </ASoftFocus>
    </Animated.View>
  );
};

const ALyricLine = memo(
  OneLine,
  (was, now) =>
    was.words === now.words &&
    was.isStill === now.isStill &&
    was.standing.opacity === now.standing.opacity &&
    was.standing.scale === now.standing.scale &&
    was.standing.blur === now.standing.blur,
);

ALyricLine.displayName = 'ALyricLine';

export { ALyricLine };
