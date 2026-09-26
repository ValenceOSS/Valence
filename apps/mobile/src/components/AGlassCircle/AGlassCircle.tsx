import { StyleSheet, View } from 'react-native';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGlassCircleProps } from './AGlassCircle.types';

const ROUND = 40;

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: ROUND / 2,
    height: ROUND,
    justifyContent: 'center',
    width: ROUND,
  },
  glass: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * A round button holding one icon, as the controls floating over a page are drawn: on liquid glass
 * where the phone has it, and on a dark disc where it does not, so it reads over artwork and over a
 * plain page alike.
 *
 * @param of - The icon.
 * @param label - What pressing it does, for somebody who cannot see it.
 * @param onPress - Told it was pressed.
 * @param ink - The colour of the icon on the glass, where what is behind the glass calls for one
 *   other than the theme's.
 */
const AGlassCircle = ({ of, label, onPress, ink }: AGlassCircleProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={label} onPress={onPress}>
      {hasLiquidGlass() ? (
        <View style={styles.glass}>
          <AGlass roundness={ROUND / 2} />
          <Icon of={of} size={24} colour={ink ?? colours.text} />
        </View>
      ) : (
        <View style={styles.circle}>
          <Icon of={of} size={24} colour="#ffffff" />
        </View>
      )}
    </Button>
  );
};

AGlassCircle.displayName = 'AGlassCircle';

export { AGlassCircle };
