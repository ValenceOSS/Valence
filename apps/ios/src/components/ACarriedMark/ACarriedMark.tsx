import { Animated, View } from 'react-native';
import { TheMark } from '@ValencePhone/components/TheMark/TheMark';
import { useTheCarriedMark } from '@ValencePhone/components/ACarriedMark/useTheCarriedMark';
import type { ACarriedMarkProps } from './ACarriedMark.types';

/**
 * Valence's mark, arriving from wherever the last screen's mark was when that screen left, so that
 * from choosing a server to the corner of the library it reads as one mark moving rather than one
 * vanishing and another appearing.
 *
 * @param high - How tall it sits.
 * @param isHandedOn - Whether it goes on to the next screen when this one goes, which the
 *   library's does not.
 */
const ACarriedMark = ({ high, isHandedOn = true }: ACarriedMarkProps) => {
  const { placed, onPlaced, shown, following } = useTheCarriedMark(isHandedOn);

  return (
    <View ref={placed} collapsable={false} onLayout={onPlaced}>
      <Animated.View style={[following, { opacity: shown }]}>
        <TheMark {...(high === undefined ? {} : { high })} />
      </Animated.View>
    </View>
  );
};

ACarriedMark.displayName = 'ACarriedMark';

export { ACarriedMark };
