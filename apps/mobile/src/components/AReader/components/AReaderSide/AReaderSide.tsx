import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronsLeftRight,
  ChevronsUpDown,
  Lock,
  Scan,
  Unlock,
} from '@keyline-icons/react-native';
import { Bookmark as BookmarkFilled } from '@keyline-icons/react-native/fill';
import { Image, StyleSheet, View } from 'react-native';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AReaderSideProps } from './AReaderSide.types';

const TITLE_THICK = 20;

const BAR_THICK = 4;

const COVER_TALL = 1.42;

const FIT_GLYPHS = { both: Scan, height: ChevronsUpDown, width: ChevronsLeftRight } as const;

const FIT_SAYS = {
  both: 'Showing whole pages. Fill the width instead',
  height: 'Filling the height. Show whole pages instead',
  width: 'Filling the width. Fill the height instead',
} as const;

const styles = StyleSheet.create({
  bar: { borderRadius: BAR_THICK / 2, overflow: 'hidden', position: 'absolute', width: BAR_THICK },
  buttons: { alignItems: 'center', gap: 14 },
  cover: { borderRadius: 8, overflow: 'hidden' },
  foot: { alignItems: 'center', gap: 6 },
  middle: { alignSelf: 'stretch', flex: 1 },
  side: { alignItems: 'center', gap: 16, position: 'absolute' },
  title: {
    alignItems: 'center',
    height: TITLE_THICK,
    justifyContent: 'center',
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
});

/**
 * What sits beside the book on the far side from its controls, on a folding phone opened out to
 * two pages: things to glance at and to reach for with the other hand.
 *
 * At the top, a turn onwards pointing the way the book is read, a mark for the pages showing, a
 * lock that holds the pages still, and how each page fills its leaf. Down the middle, the chapter's
 * name running up the side beside a bar filling as it is read, and at the foot how far through it
 * is — or, in its last few pages, the next chapter's first page and the way on to it.
 *
 * @param breadth - How wide the panel is.
 * @param side - Which side of the window it is on.
 * @param top - How far down it starts.
 * @param below - How much room to leave at the bottom.
 * @param ink - The colour of the words and the buttons' icons.
 * @param isRightToLeft - Whether the book is read right to left, so onwards points left.
 * @param isMarked - Whether the pages showing are marked.
 * @param isLocked - Whether the pages are held still.
 * @param fit - How each page fills its leaf.
 * @param place - The chapter's name.
 * @param through - How far through the chapter, from nothing to one.
 * @param next - The next chapter's name and first page, once it is near, or nothing.
 * @param onForward - Told to turn onwards.
 * @param onMark - Told to mark or unmark the pages showing.
 * @param onLock - Told to lock or unlock the pages.
 * @param onFit - Told to change how the pages fill their leaves.
 * @param onReadOn - Told to open the next chapter.
 */
const AReaderSide = ({
  breadth,
  side,
  top,
  below,
  ink,
  isRightToLeft,
  isMarked,
  isLocked,
  fit,
  place,
  through,
  next,
  onForward,
  onMark,
  onLock,
  onFit,
  onReadOn,
}: AReaderSideProps) => {
  const [tall, setTall] = useState(0);
  const cover = breadth - 24;

  return (
    <View
      style={[
        styles.side,
        { bottom: below + 16, top, width: breadth },
        side === 'left' ? { left: 0 } : { right: 0 },
      ]}
    >
      <View style={styles.buttons}>
        <AGlassCircle
          of={isRightToLeft ? ArrowLeft : ArrowRight}
          label="Turn onwards"
          onPress={onForward}
          ink={ink}
        />
        <AGlassCircle
          of={isMarked ? BookmarkFilled : Bookmark}
          label={isMarked ? 'Unmark these pages' : 'Mark these pages'}
          onPress={onMark}
          ink={ink}
        />
        <AGlassCircle
          of={isLocked ? Lock : Unlock}
          label={isLocked ? 'Let the pages turn' : 'Hold the pages still'}
          onPress={onLock}
          ink={ink}
        />
        <AGlassCircle of={FIT_GLYPHS[fit]} label={FIT_SAYS[fit]} onPress={onFit} ink={ink} />
      </View>

      <View
        style={styles.middle}
        onLayout={({ nativeEvent }) => {
          setTall(nativeEvent.layout.height);
        }}
      >
        {tall > 0 ? (
          <>
            <View
              style={[
                styles.title,
                {
                  left: breadth / 2 - 10 - tall / 2,
                  top: (tall - TITLE_THICK) / 2,
                  width: tall,
                },
              ]}
            >
              <Words size="small" lines={1} colour={withAlpha(ink, 0.8)}>
                {place}
              </Words>
            </View>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: withAlpha(ink, 0.15),
                  height: tall,
                  left: breadth / 2 + 10,
                  top: 0,
                },
              ]}
            >
              <View
                style={{
                  backgroundColor: ink,
                  height: tall * Math.min(Math.max(through, 0), 1),
                  width: BAR_THICK,
                }}
              />
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.foot}>
        {next === null ? (
          <Words size="small" isCentred colour={withAlpha(ink, 0.8)}>
            {`${Math.round(through * 100).toString()}%`}
          </Words>
        ) : (
          <Button tone="bare" label={`Read on: ${next.title}`} onPress={onReadOn}>
            <View style={styles.foot}>
              <View style={[styles.cover, { height: cover * COVER_TALL, width: cover }]}>
                <Image
                  source={{ uri: next.cover }}
                  style={{ height: '100%', width: '100%' }}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <Words size="small" isCentred colour={ink}>
                Read on
              </Words>
            </View>
          </Button>
        )}
      </View>
    </View>
  );
};

AReaderSide.displayName = 'AReaderSide';

export { AReaderSide };
