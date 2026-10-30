import { Fragment } from 'react';
import { Platform, View } from 'react-native';
import { Button as SystemButton, Divider, Host, Menu, RNHostView } from '@expo/ui/swift-ui';
import { Button } from '@ValenceMobile/components/Button/Button';
import { showActionSheet } from '@ValenceMobile/platform/showActionSheet';
import type { AMenuProps } from './AMenu.types';
import { say } from '@ValenceI18n/say';

/**
 * A menu of things to do with something, or of one thing to choose, dropping from whatever opens it
 * the way an iPhone's own apps drop theirs: each with its icon or a tick against the one chosen,
 * those that remove something in red, and a line between groups. Where there is no such menu, the
 * phone's own list of choices stands in.
 *
 * @param label - What it is, for anybody who cannot see what opens it.
 * @param title - What the list is about, where the stand-in names it.
 * @param items - What there is to do, in order.
 * @param children - What opens it.
 */
const AMenu = ({ label, title, items, children }: AMenuProps) => {
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

  return (
    <Host matchContents>
      <Menu
        label={
          <RNHostView matchContents>
            <View accessible accessibilityRole="button" accessibilityLabel={label}>
              {children}
            </View>
          </RNHostView>
        }
      >
        {items.map((item) => (
          <Fragment key={item.id}>
            {item.startsAGroup === true ? <Divider /> : null}
            <SystemButton
              label={item.label}
              {...(item.isChosen === true
                ? { systemImage: 'checkmark' as const }
                : item.symbol === undefined
                  ? {}
                  : { systemImage: item.symbol })}
              {...(item.isDestructive === true ? { role: 'destructive' as const } : {})}
              onPress={item.onChoose}
            />
          </Fragment>
        ))}
      </Menu>
    </Host>
  );
};

AMenu.displayName = 'AMenu';

export { AMenu };
