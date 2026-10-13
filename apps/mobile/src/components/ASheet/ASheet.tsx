import { ScrollView, StyleSheet, View } from 'react-native';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ASheetProps } from './ASheet.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  foot: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SCREEN_EDGE },
  lines: { gap: 24, paddingBottom: 24, paddingTop: 4 },
  scrolls: { flexGrow: 0, flexShrink: 1 },
});

/**
 * A sheet of frosted glass that rises from the foot of the screen as far as what it holds, with
 * what it is for across its top beside the way to put it away, and whatever it holds scrolling
 * beneath. Every card in the app is one of these, so they all look and move as the player's
 * panels do.
 *
 * @param isOpen - Whether it is out.
 * @param title - What it is for.
 * @param closeLabel - What the way to put it away is called, for anybody who cannot see it.
 * @param onClose - Told to put it away.
 * @param footer - What stays along its foot while the rest scrolls, where anything does.
 * @param children - What it holds.
 */
const ASheet = ({
  isOpen,
  title,
  closeLabel = say('common.done'),
  onClose,
  footer,
  children,
}: ASheetProps) => {
  const colours = useTheColours();

  return (
    <ABottomSheet
      isOpen={isOpen}
      label={title}
      title={title}
      closeLabel={closeLabel}
      onClose={onClose}
    >
      <ScrollView
        style={styles.scrolls}
        contentContainerStyle={styles.lines}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer === undefined ? null : (
        <View style={[styles.foot, { borderTopColor: colours.border }]}>{footer}</View>
      )}
    </ABottomSheet>
  );
};

ASheet.displayName = 'ASheet';

export { ASheet };
