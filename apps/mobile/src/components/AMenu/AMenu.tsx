import { useState } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { requireNativeView } from 'expo';
import { Button } from '@ValenceMobile/components/Button/Button';
import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import type { AMenuProps, NativeMenuProps } from './AMenu.types';
import { say } from '@ValenceI18n/say';

const TheMenu = requireNativeView<NativeMenuProps>('ValenceMenu');

const FADED_WHILE_OPEN = 0.35;

const FADES_OVER = 200;

/**
 * A menu of things to do with something, or of one thing to choose, dropping from whatever opens it
 * the way an iPhone's own apps drop theirs: each with its icon or a tick against the one chosen,
 * those that remove something in red, and a line between groups. Where there is no such menu, the
 * phone's own list of choices stands in.
 *
 * On an iPhone the system's menu button lies unseen over what opens it, since the system lifts
 * whatever is drawn inside its button away as the menu opens and settles it back where it stood,
 * which on a page scrolled meanwhile is over the wrong part of it. What opens it gives way under a
 * finger as any button does, and fades while the menu is open.
 *
 * @param label - What it is, for anybody who cannot see what opens it.
 * @param title - What the list is about, where the stand-in names it.
 * @param items - What there is to do, in order.
 * @param children - What opens it.
 */
const AMenu = ({ label, title, items, children }: AMenuProps) => {
  const [shown] = useState(() => new Animated.Value(1));

  if (Platform.OS !== 'ios') {
    return (
      <Button
        tone="bare"
        label={label}
        onPress={() => {
          const options = [...items.map((item) => item.label), say('common.cancel')];
          const destructive = items.findIndex((item) => item.isDestructive === true);

          showActionSheet(
            {
              ...(title === undefined ? {} : { title }),
              options,
              cancelButtonIndex: items.length,
              ...(destructive === -1 ? {} : { destructiveButtonIndex: destructive }),
            },
            (picked) => {
              items[picked]?.onChoose();
            },
          );
        }}
      >
        {children}
      </Button>
    );
  }

  const fadeTo = (toValue: number) => {
    Animated.timing(shown, { toValue, duration: FADES_OVER, useNativeDriver: true }).start();
  };

  return (
    <Button tone="bare" label={label}>
      <Animated.View pointerEvents="none" style={{ opacity: shown }}>
        {children}
      </Animated.View>

      <TheMenu
        style={StyleSheet.absoluteFill}
        items={items.map(({ id, label: says, symbol, isChosen, isDestructive, startsAGroup }) => ({
          id,
          label: says,
          ...(symbol === undefined ? {} : { symbol }),
          ...(isChosen === undefined ? {} : { isChosen }),
          ...(isDestructive === undefined ? {} : { isDestructive }),
          ...(startsAGroup === undefined ? {} : { startsAGroup }),
        }))}
        onChoose={({ nativeEvent }) => {
          items.find((item) => item.id === nativeEvent.id)?.onChoose();
        }}
        onOpen={() => {
          fadeTo(FADED_WHILE_OPEN);
        }}
        onClose={() => {
          fadeTo(1);
        }}
      />
    </Button>
  );
};

AMenu.displayName = 'AMenu';

export { AMenu };
