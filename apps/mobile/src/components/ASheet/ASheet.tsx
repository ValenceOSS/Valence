import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ASheetProps } from './ASheet.types';

const styles = StyleSheet.create({
  foot: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SCREEN_EDGE },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  lines: { gap: 24, paddingBottom: 48, paddingTop: 8 },
  title: { flex: 1 },
  whole: { flex: 1 },
});

/**
 * A sheet that slides up over the page, as the phone's own sheets do, with what it is for across its
 * top beside the way to put it away, and whatever it holds scrolling beneath. It keeps clear of the
 * island and the rounded corners whichever way the phone is held, since a sheet over a book read on
 * its side is as wide as the screen.
 *
 * @param isOpen - Whether it is out.
 * @param title - What it is for.
 * @param closeLabel - What the way to put it away says.
 * @param onClose - Told to put it away.
 * @param footer - What stays along its foot while the rest scrolls, where anything does.
 * @param children - What it holds.
 */
const ASheet = ({ isOpen, title, closeLabel = 'Done', onClose, footer, children }: ASheetProps) => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const sides = {
    paddingLeft: Math.max(SCREEN_EDGE, room.left),
    paddingRight: Math.max(SCREEN_EDGE, room.right),
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.whole, { backgroundColor: colours.surface }]}>
        <View style={[styles.head, sides]}>
          <View style={styles.title}>
            <Words size="heading" lines={1}>
              {title}
            </Words>
          </View>
          <Button tone="quiet" onPress={onClose}>
            {closeLabel}
          </Button>
        </View>

        <ScrollView
          contentContainerStyle={[styles.lines, sides]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {footer === undefined ? null : (
          <View
            style={[
              styles.foot,
              sides,
              { borderTopColor: colours.border, paddingBottom: Math.max(room.bottom, SCREEN_EDGE) },
            ]}
          >
            {footer}
          </View>
        )}
      </View>
    </Modal>
  );
};

ASheet.displayName = 'ASheet';

export { ASheet };
