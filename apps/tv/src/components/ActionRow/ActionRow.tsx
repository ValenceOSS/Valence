import { StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ActionRowProps } from './ActionRow.types';

const ICON_SIZE = 30;

/**
 * One thing to do with a title, as a line in the list beneath its description: an icon and a few
 * words, quiet until the remote reaches it and then lit white, as the television's own apps list
 * what can be done with a title.
 *
 * Where carrying on is the thing to do, the line says how far through somebody is.
 *
 * @param label - What pressing it does.
 * @param icon - What leads the line, or nothing for a line that keeps its place in a list beside
 *   lines that have one.
 * @param onPress - Told when it is pressed.
 * @param watchedFraction - How far through the title this viewer is, for the line that resumes it.
 * @param hasPreferredFocus - Whether the remote starts here.
 */
const ActionRow = ({
  label,
  icon,
  onPress,
  watchedFraction,
  hasPreferredFocus = false,
}: ActionRowProps) => (
  <Focusable
    label={label}
    onPress={onPress}
    hasPreferredFocus={hasPreferredFocus}
    scale={1}
    isAnchoredLeft
  >
    {(isFocused) => {
      const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;

      return (
        <View style={[styles.row, isFocused && styles.focused]}>
          {icon === undefined ? (
            <View style={styles.blank} />
          ) : (
            <Icon of={icon} colour={ink} size={ICON_SIZE} />
          )}

          <Text numberOfLines={1} style={[styles.label, { color: ink }]}>
            {label}
          </Text>

          {watchedFraction === undefined ? null : (
            <ProgressLine fraction={watchedFraction} isInline />
          )}
        </View>
      );
    }}
  </Focusable>
);

ActionRow.displayName = 'ActionRow';

const styles = StyleSheet.create({
  row: {
    width: tokens.ACTION_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.sm,
  },
  focused: { backgroundColor: '#ffffff' },
  label: { flex: 1, fontSize: tokens.type.body, fontWeight: '500' },
  blank: { width: ICON_SIZE, height: ICON_SIZE },
});

export { ActionRow };
