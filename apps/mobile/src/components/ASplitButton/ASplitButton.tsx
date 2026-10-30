import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ASplitButtonProps } from './ASplitButton.types';

const OUTSIDE = 12;

const JOIN = 4;

const styles = StyleSheet.create({
  part: { alignItems: 'center', height: 36, justifyContent: 'center', width: 40 },
  parts: { flexDirection: 'row', gap: 2 },
});

/**
 * A few small things to do with one thing, drawn as one button split into joined segments, each an
 * icon lit faintly in the page's ink; only the outside corners are rounded, so the segments read as
 * one control.
 *
 * @param parts - Each segment: its icon, what it does, whether what it stands for is on, and what
 *   pressing it does.
 */
const ASplitButton = ({ parts }: ASplitButtonProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.parts}>
      {parts.map((part, at) => (
        <Button
          key={part.label}
          tone="bare"
          label={part.label}
          onPress={part.onPress}
          {...(part.isChosen === undefined ? {} : { isChosen: part.isChosen })}
        >
          <View
            style={[
              styles.part,
              {
                backgroundColor: withAlpha(colours.text, 0.12),
                borderBottomLeftRadius: at === 0 ? OUTSIDE : JOIN,
                borderBottomRightRadius: at === parts.length - 1 ? OUTSIDE : JOIN,
                borderTopLeftRadius: at === 0 ? OUTSIDE : JOIN,
                borderTopRightRadius: at === parts.length - 1 ? OUTSIDE : JOIN,
              },
            ]}
          >
            <Icon of={part.icon} size={18} colour={colours.text} />
          </View>
        </Button>
      ))}
    </View>
  );
};

ASplitButton.displayName = 'ASplitButton';

export { ASplitButton };
