import { Image } from 'react-native';
import mark from '@ValenceMobile/assets/valence-mark.png';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheMarkProps } from './TheMark.types';

const WIDER_BY = 624 / 458;

/**
 * Valence's mark, in the ink of the words around it, as the web draws it in the corner of its bar.
 *
 * @param high - How tall it is.
 */
const TheMark = ({ high = 28 }: TheMarkProps) => {
  const colours = useTheColours();

  return (
    <Image
      source={mark}
      style={{ height: high, tintColor: colours.text, width: high * WIDER_BY }}
      accessibilityRole="image"
      accessibilityLabel="Valence"
    />
  );
};

TheMark.displayName = 'TheMark';

export { TheMark };
