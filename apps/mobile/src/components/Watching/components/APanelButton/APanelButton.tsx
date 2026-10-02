import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SIDE_PANEL } from '@ValenceMobile/components/Watching/SIDE_PANEL';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { APanelButtonProps } from './APanelButton.types';

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  strong: { backgroundColor: SIDE_PANEL.colours.text },
  strongWord: { color: '#000000' },
  word: { color: SIDE_PANEL.colours.text, fontFamily: FONTS.sans.semibold, fontSize: 14 },
});

/**
 * A button in a panel over the player, white on the dark of the panel whatever the phone's own
 * appearance, since the panel is dark whatever it is.
 *
 * @param says - What it says.
 * @param onPress - Told it was pressed.
 * @param label - What it does, where that is more than what it says.
 * @param isStrong - Whether it is the one thing the panel is asking for.
 * @param isDisabled - Whether it can be pressed.
 */
const APanelButton = ({
  says,
  onPress,
  label = says,
  isStrong = false,
  isDisabled = false,
}: APanelButtonProps) => (
  <Button tone="bare" label={label} isDisabled={isDisabled} onPress={onPress}>
    <View style={[styles.pill, isStrong && styles.strong, isDisabled && styles.disabled]}>
      <Text style={[styles.word, isStrong && styles.strongWord]}>{says}</Text>
    </View>
  </Button>
);

APanelButton.displayName = 'APanelButton';

export { APanelButton };
