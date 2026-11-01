import { StyleSheet, View } from 'react-native';
import { AMenu } from '@ValenceMobile/components/AMenu/AMenu';
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
 * one control. A part that cannot be pressed is drawn dimmed, as a choice already made is.
 *
 * @param parts - Each segment: its icon, what it does, whether what it stands for is on, how it is
 *   coloured — solid in the page's ink for the thing to press, or in the danger colour for one that
 *   removes something — what pressing it does, or the native menu that drops from it in place of
 *   pressing it, and whether it can be pressed at all.
 */
const ASplitButton = ({ parts }: ASplitButtonProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.parts}>
      {parts.map((part, at) => {
        const drawn = (
          <View
            style={[
              styles.part,
              {
                backgroundColor:
                  part.tone === 'bold'
                    ? colours.text
                    : part.tone === 'danger'
                      ? withAlpha(colours.danger, 0.18)
                      : withAlpha(colours.text, 0.12),
                borderBottomLeftRadius: at === 0 ? OUTSIDE : JOIN,
                borderBottomRightRadius: at === parts.length - 1 ? OUTSIDE : JOIN,
                borderTopLeftRadius: at === 0 ? OUTSIDE : JOIN,
                borderTopRightRadius: at === parts.length - 1 ? OUTSIDE : JOIN,
              },
            ]}
          >
            <Icon
              of={part.icon}
              size={18}
              colour={
                part.tone === 'bold'
                  ? colours.surface
                  : part.tone === 'danger'
                    ? colours.danger
                    : colours.text
              }
            />
          </View>
        );

        return part.menu === undefined ? (
          <Button
            key={part.label}
            tone="bare"
            label={part.label}
            {...(part.onPress === undefined ? {} : { onPress: part.onPress })}
            {...(part.isChosen === undefined ? {} : { isChosen: part.isChosen })}
            {...(part.isDisabled === true ? { isDisabled: true } : {})}
          >
            {drawn}
          </Button>
        ) : (
          <AMenu
            key={part.label}
            label={part.label}
            title={part.menu.title}
            items={part.menu.items}
          >
            {drawn}
          </AMenu>
        );
      })}
    </View>
  );
};

ASplitButton.displayName = 'ASplitButton';

export { ASplitButton };
