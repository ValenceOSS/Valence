import { useContext } from 'react';
import { Animated, View } from 'react-native';
import { ARRIVING } from '@ValencePhone/components/AnArrival/ARRIVING';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
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

  if (arriving === null) {
    return <View style={style}>{children}</View>;
  }

  const opacity = arriving.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const translateX = arriving.interpolate({
    inputRange: [-1, 1],
    outputRange: isStill ? [0, 0] : [-COMES_FROM, COMES_FROM],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
};

AnArrival.displayName = 'AnArrival';

export { AnArrival };
