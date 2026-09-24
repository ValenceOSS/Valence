import { ChevronDown, ChevronLeft } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import type { BackArrowProps } from './BackArrow.types';

const styles = StyleSheet.create({
  place: { left: 12, position: 'absolute' },
});

/**
 * The way back, as an arrow in the top left that stays there while the page beneath it scrolls:
 * on liquid glass where the phone has it, and on a dark disc where it does not, so that it reads
 * over artwork and over a plain page alike.
 *
 * @param onBack - Told somebody wants to go back.
 * @param pointsDown - Whether it points down, for a page that rose from below and goes back down.
 */
const BackArrow = ({ onBack, pointsDown = false }: BackArrowProps) => {
  const room = useSafeAreaInsets();

  return (
    <View style={[styles.place, { top: room.top + 4 }]}>
      <AGlassCircle
        of={pointsDown ? ChevronDown : ChevronLeft}
        label={pointsDown ? 'Close' : 'Back'}
        onPress={onBack}
      />
    </View>
  );
};

BackArrow.displayName = 'BackArrow';

export { BackArrow };
