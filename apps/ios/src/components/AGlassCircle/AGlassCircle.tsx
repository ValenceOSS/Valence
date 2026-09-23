import { StyleSheet, View } from 'react-native';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
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
 */
const AGlassCircle = ({ of, label, onPress }: AGlassCircleProps) => {
  const colours = useTheColours();

  return (
    <Button tone="bare" label={label} onPress={onPress}>
      {hasLiquidGlass() ? (
        <View style={styles.glass}>
          <AGlass roundness={ROUND / 2} />
          <Icon of={of} size={24} colour={colours.text} />
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
