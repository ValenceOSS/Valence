import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ARoundActionProps } from './ARoundAction.types';

const ROUND = 54;

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: 7, width: 74 },
  circle: {
    alignItems: 'center',
    borderRadius: ROUND / 2,
    height: ROUND,
    justifyContent: 'center',
    width: ROUND,
  },
  said: { fontFamily: FONTS.sans.medium, fontSize: 12, textAlign: 'center' },
});

/**
 * One thing to do with what a card is about, as a sheet on the phone offers it: an icon on a round
 * button lit faintly in the page's ink, so it takes on whatever colour the page is, with what it
 * does written small beneath.
 *
 * @param icon - What it is drawn as.
 * @param says - What it does, written beneath it and said to somebody who cannot see it.
 * @param onPress - Told it was pressed.
 * @param ink - The colour of the icon, where it is not the page's own ink — a favourite's red.
 * @param isChosen - Whether what it stands for is on, for somebody who cannot see the icon change.
 * @param isDisabled - Whether it cannot be pressed just now.
 */
const ARoundAction = ({ icon, says, onPress, ink, isChosen, isDisabled }: ARoundActionProps) => {
  const colours = useTheColours();

  return (
    <Button
      tone="bare"
      label={says}
      onPress={onPress}
      {...(isChosen === undefined ? {} : { isChosen })}
      {...(isDisabled === undefined ? {} : { isDisabled })}
    >
      <View style={styles.action}>
        <View style={[styles.circle, { backgroundColor: withAlpha(colours.text, 0.12) }]}>
          <Icon of={icon} size={22} colour={ink ?? colours.text} />
        </View>
        <Text numberOfLines={1} style={[styles.said, { color: colours.textMuted }]}>
          {says}
        </Text>
      </View>
    </Button>
  );
};

ARoundAction.displayName = 'ARoundAction';

export { ARoundAction };
