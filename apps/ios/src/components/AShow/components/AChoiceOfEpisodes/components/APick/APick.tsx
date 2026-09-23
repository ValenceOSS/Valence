import { Check, Minus } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { APickProps } from './APick.types';

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
});

/**
 * The round mark beside something that can be picked: empty, ticked, or, for a season with only some
 * of its episodes picked, a dash.
 *
 * @param standing - How much of it is picked.
 */
const APick = ({ standing }: APickProps) => {
  const colours = useTheColours();
  const isMarked = standing !== 'none';

  return (
    <View
      style={[
        styles.mark,
        {
          backgroundColor: isMarked ? colours.accent : 'transparent',
          borderColor: isMarked ? colours.accent : colours.textMuted,
        },
      ]}
    >
      {isMarked ? (
        <Icon of={standing === 'all' ? Check : Minus} size={14} colour={colours.accentContrast} />
      ) : null}
    </View>
  );
};

APick.displayName = 'APick';

export { APick };
