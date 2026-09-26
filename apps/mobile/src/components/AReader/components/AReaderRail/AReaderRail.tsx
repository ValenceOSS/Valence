import { ArrowRight, ChevronLeft, List } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { APageScrubber } from '@ValenceMobile/components/APageScrubber/APageScrubber';
import { Words } from '@ValenceMobile/components/Words/Words';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AReaderRailProps } from './AReaderRail.types';

const OUTLINES = {
  buttons: 'rgba(0, 110, 255, 0.28)',
  foot: 'rgba(255, 190, 0, 0.35)',
  rail: 'rgba(255, 0, 60, 0.16)',
  scrubber: 'rgba(0, 200, 90, 0.3)',
} as const;

const styles = StyleSheet.create({
  buttons: { alignItems: 'center', gap: 14 },
  column: { flex: 1 },
  rail: { alignItems: 'center', gap: 14, position: 'absolute' },
});

/**
 * The reader's controls down the strip at the side of a folding phone's screen, as the system's
 * own apps put theirs there: the way back and the contents at the top, then every page of the
 * chapter as a column to scrub through, the one showing held largest in the middle and ringed, and
 * at the foot how far through it is — or, on the last page, the way on to the next chapter.
 *
 * The buttons and the column are placed on their own, so either can be nudged across without the
 * other, and each part can be outlined in a colour of its own while the placing is worked out.
 *
 * @param breadth - How wide the strip is.
 * @param freeFrom - How far down the strip starts being free, under the clock and the island.
 * @param below - How much room to leave at the bottom.
 * @param side - Which side the strip is on.
 * @param centreIn - How far in from that side of the window the rail's centre line runs.
 * @param pictures - A small picture of every page.
 * @param page - The page showing.
 * @param ink - The colour of the words and the ring.
 * @param tuning - Nudges to where each part sits, and whether the parts are outlined.
 * @param onPage - Told to turn to a page.
 * @param onBack - Told somebody is done reading.
 * @param onPanel - Told to bring out the contents and settings.
 * @param onReadOn - Told to open the next chapter, where the last page is showing and there is one.
 */
const AReaderRail = ({
  breadth,
  freeFrom,
  below,
  side,
  centreIn,
  pictures,
  page,
  ink,
  tuning,
  onPage,
  onBack,
  onPanel,
  onReadOn,
}: AReaderRailProps) => {
  const outline = (colour: string) => (tuning.isOutlined ? { backgroundColor: colour } : null);
  const buttonsAcross = { transform: [{ translateX: tuning.buttonsX }] };

  return (
    <View
      style={[
        styles.rail,
        { bottom: below + 8, top: tuning.top ?? freeFrom, width: breadth },
        side === 'right' ? { right: centreIn - breadth / 2 } : { left: centreIn - breadth / 2 },
        outline(OUTLINES.rail),
      ]}
    >
      <View style={[styles.buttons, buttonsAcross, outline(OUTLINES.buttons)]}>
        <AGlassCircle of={ChevronLeft} label="Back" onPress={onBack} ink={ink} />
        <AGlassCircle of={List} label="Contents and settings" onPress={onPanel} ink={ink} />
      </View>

      <View
        style={[
          styles.column,
          {
            transform: [{ translateX: tuning.scrubberX }],
            width: tuning.scrubberWidth ?? breadth,
          },
          outline(OUTLINES.scrubber),
        ]}
      >
        <APageScrubber
          pictures={pictures}
          page={page}
          ink={ink}
          onPage={onPage}
          style={styles.column}
        />
      </View>

      <View style={[buttonsAcross, outline(OUTLINES.foot)]}>
        {onReadOn === null ? (
          <Words size="small" isCentred colour={withAlpha(ink, 0.8)}>
            {`${(page + 1).toString()}/${pictures.length.toString()}`}
          </Words>
        ) : (
          <AGlassCircle of={ArrowRight} label="Next chapter" onPress={onReadOn} ink={ink} />
        )}
      </View>
    </View>
  );
};

AReaderRail.displayName = 'AReaderRail';

export { AReaderRail };
