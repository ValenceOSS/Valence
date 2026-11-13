import { useState } from 'react';
import { SHEET_HOLD } from '@ValenceMobile/components/ASheet/SHEET_HOLD';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ASheetProps } from './ASheet.types';
import { say } from '@ValenceI18n/say';

const PULLED_TO_CLOSE = 70;

const styles = StyleSheet.create({
  foot: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: SCREEN_EDGE },
  lines: { gap: 24, paddingBottom: 24, paddingTop: 4 },
  scrolls: { flexGrow: 0, flexShrink: 1 },
});

/**
 * A sheet of frosted glass that rises from the foot of the screen as far as what it holds, with
 * what it is for across its top beside the way to put it away, and whatever it holds scrolling
 * beneath. Every card in the app is one of these, so they all look and move as the player's
 * panels do. Pulling what it holds down past its top puts it away, as dragging its handle does.
 *
 * @param isOpen - Whether it is out.
 * @param title - What it is for.
 * @param closeLabel - What the way to put it away is called, for anybody who cannot see it.
 * @param onClose - Told to put it away.
 * @param footer - What stays along its foot while the rest scrolls, where anything does.
 * @param tallest - How much of the screen it may rise to, where less than the usual.
 * @param isTitled - Whether what it is for is written across its top, or only told to anybody who
 *   cannot see it, where what it is for is already plain.
 * @param isSteady - Whether what it holds stays still where it all fits, scrolling only where it
 *   does not, for a sheet of controls that are dragged themselves. While it all fits, a drag down
 *   anywhere nothing in it takes puts it away; while it scrolls, only one by its top does.
 * @param children - What it holds, any of which may hold it still while a finger is on it, so a
 *   picture being dragged or a slider being moved does not scroll it.
 */
const ASheet = ({
  isOpen,
  title,
  closeLabel = say('common.done'),
  onClose,
  footer,
  tallest,
  isTitled = true,
  isSteady = false,
  children,
}: ASheetProps) => {
  const colours = useTheColours();
  const [isHeld, setIsHeld] = useState(false);
  const [room, setRoom] = useState({ shown: 0, held: 0 });
  const fits = room.shown > 0 && room.held <= room.shown + 1;

  return (
    <ABottomSheet
      isOpen={isOpen}
      label={title}
      {...(isTitled ? { title } : {})}
      closeLabel={closeLabel}
      onClose={onClose}
      {...(tallest === undefined ? {} : { tallest })}
      isDraggedAnywhere={isSteady && fits}
    >
      <SHEET_HOLD.Provider value={setIsHeld}>
        <ScrollView
          style={styles.scrolls}
          scrollEnabled={!isHeld && !(isSteady && fits)}
          contentContainerStyle={styles.lines}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={!isSteady}
          onLayout={({ nativeEvent }) => {
            const shown = nativeEvent.layout.height;

            setRoom((was) => (was.shown === shown ? was : { ...was, shown }));
          }}
          onContentSizeChange={(_, held) => {
            setRoom((was) => (was.held === held ? was : { ...was, held }));
          }}
          onScrollEndDrag={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y < -PULLED_TO_CLOSE) {
              onClose();
            }
          }}
        >
          {children}
        </ScrollView>
      </SHEET_HOLD.Provider>

      {footer === undefined ? null : (
        <View style={[styles.foot, { borderTopColor: colours.border }]}>{footer}</View>
      )}
    </ABottomSheet>
  );
};

ASheet.displayName = 'ASheet';

export { ASheet };
