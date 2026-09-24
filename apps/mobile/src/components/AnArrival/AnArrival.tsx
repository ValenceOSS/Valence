import { useContext, useMemo } from 'react';
import { Animated, View } from 'react-native';
import { ARRIVING } from '@ValenceMobile/components/AnArrival/ARRIVING';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import type { AnArrivalProps } from './AnArrival.types';

const COMES_FROM = 40;

/**
 * Whatever belongs to the part of the library on screen, coming in from the side it was chosen from
 * when somebody switches to it, while what belongs to every part — the row they chose it in — stays
 * where it is. Outside a library it is simply drawn.
 *
 * Where somebody has asked their phone for less motion it only fades in.
 *
 * @param children - What arrives.
 * @param style - How what arrives is laid out.
 */
const AnArrival = ({ children, style }: AnArrivalProps) => {
  const arriving = useContext(ARRIVING);
  const isStill = usePrefersStillness();

  const moving = useMemo(
    () =>
      arriving === null
        ? null
        : {
            opacity: arriving.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateX: arriving.interpolate({
                  inputRange: [-1, 1],
                  outputRange: isStill ? [0, 0] : [-COMES_FROM, COMES_FROM],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
    [arriving, isStill],
  );

  if (moving === null) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, moving]}>{children}</Animated.View>;
};

AnArrival.displayName = 'AnArrival';

export { AnArrival };
