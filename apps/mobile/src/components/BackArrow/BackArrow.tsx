import { ChevronDown, ChevronLeft, X } from '@keyline-icons/react-native';
import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { CARD_GOES_BACK } from '@ValenceMobile/components/APageStack/CARD_GOES_BACK';
import { IS_A_CARD } from '@ValenceMobile/components/APageStack/IS_A_CARD';
import type { BackArrowProps } from './BackArrow.types';
import { say } from '@ValenceI18n/say';

const ON_A_CARD = 14;

const styles = StyleSheet.create({
  place: { left: 12, position: 'absolute' },
});

/**
 * The way back, as an arrow in the top left that stays there while the page beneath it scrolls:
 * on liquid glass where the phone has it, and on a dark disc where it does not, so that it reads
 * over artwork and over a plain page alike. On a page drawn as a card it is a cross instead, as a
 * sheet closes, sitting a little in from the card's rounded top — unless the card took the place of
 * another, when it is an arrow back to that one.
 *
 * @param onBack - Told somebody wants to go back.
 * @param pointsDown - Whether it points down, for a page that rose from below and goes back down.
 */
const BackArrow = ({ onBack, pointsDown = false }: BackArrowProps) => {
  const room = useSafeAreaInsets();
  const isACard = useContext(IS_A_CARD);
  const goesBack = useContext(CARD_GOES_BACK);
  const closes = isACard && !goesBack;

  return (
    <View style={[styles.place, { top: isACard ? ON_A_CARD : room.top + 4 }]}>
      <AGlassCircle
        of={closes ? X : pointsDown ? ChevronDown : ChevronLeft}
        label={closes || pointsDown ? say('common.close') : say('common.back')}
        onPress={onBack}
      />
    </View>
  );
};

BackArrow.displayName = 'BackArrow';

export { BackArrow };
