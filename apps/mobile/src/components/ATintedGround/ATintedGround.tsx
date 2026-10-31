import { StyleSheet, View } from 'react-native';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ATintedGroundProps } from './ATintedGround.types';

const HELD_TO = 75;

/**
 * The ground of a card tinted from its artwork: the tint itself down past where the artwork ends,
 * deepening to the page's own colour towards the foot.
 *
 * @param tint - The colour taken from the artwork.
 * @param into - What it deepens to at the foot, where that is not the page's own colour — the dark
 *   of a remote, which is dark whatever the page is.
 */
const ATintedGround = ({ tint, into }: ATintedGroundProps) => {
  const colours = useTheColours();
  const foot = into ?? colours.surface;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          experimental_backgroundImage: `linear-gradient(to bottom, ${tint} 0%, ${tint} ${HELD_TO.toString()}%, ${foot} 100%)`,
        },
      ]}
    />
  );
};

ATintedGround.displayName = 'ATintedGround';

export { ATintedGround };
