import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { BackArrowProps } from './BackArrow.types';

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
  place: { left: 12, position: 'absolute' },
});

/**
 * The way back, as an arrow in the top left that stays there while the page beneath it scrolls:
 * on liquid glass where the phone has it, and on a dark disc where it does not, so that it reads
 * over artwork and over a plain page alike.
 *
 * @param onBack - Told somebody wants to go back.
 */
const BackArrow = ({ onBack }: BackArrowProps) => {
  const room = useSafeAreaInsets();
  const colours = useTheColours();
  const isGlass = hasLiquidGlass();

  return (
    <View style={[styles.place, { top: room.top + 4 }]}>
      <Button tone="bare" label="Back" onPress={onBack}>
        {isGlass ? (
          <View style={styles.glass}>
            <AGlass roundness={ROUND / 2} />
            <Icon of={ChevronLeft} size={24} colour={colours.text} />
          </View>
        ) : (
          <View style={styles.circle}>
            <Icon of={ChevronLeft} size={24} colour="#ffffff" />
          </View>
        )}
      </Button>
    </View>
  );
};

BackArrow.displayName = 'BackArrow';

export { BackArrow };
