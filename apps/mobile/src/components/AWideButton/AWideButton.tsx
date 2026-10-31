import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { AWideButtonProps } from './AWideButton.types';

const TALL = 52;

const CORNER = 14;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: CORNER,
    flexDirection: 'row',
    gap: 10,
    height: TALL,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  said: { fontFamily: FONTS.sans.bold, fontSize: 17 },
});

/**
 * The second thing to do on a card, beneath the way to watch it and as tall as it: a solid icon
 * and what pressing it does on a wide button lit faintly in the page's ink.
 *
 * @param icon - The solid icon before what it says.
 * @param says - What it says.
 * @param label - What pressing it does, for somebody who cannot see it.
 * @param onPress - Told it was pressed.
 * @param isChosen - Whether what it stands for is on, where it is a choice.
 * @param isDisabled - Whether it can be pressed at all.
 */
const AWideButton = ({
  icon,
  says,
  label,
  onPress,
  isChosen,
  isDisabled = false,
}: AWideButtonProps) => {
  const colours = useTheColours();

  return (
    <Button
      tone="bare"
      label={label}
      onPress={onPress}
      isDisabled={isDisabled}
      {...(isChosen === undefined ? {} : { isChosen })}
    >
      <View style={[styles.button, { backgroundColor: withAlpha(colours.text, 0.12) }]}>
        <Icon of={icon} size={20} colour={colours.text} />
        <Text numberOfLines={1} style={[styles.said, { color: colours.text }]}>
          {says}
        </Text>
      </View>
    </Button>
  );
};

AWideButton.displayName = 'AWideButton';

export { AWideButton };
