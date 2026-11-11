import { useEffect, useState } from 'react';
import { Bookmark, ChevronLeft, SlidersHorizontal } from '@keyline-icons/react-native';
import { Bookmark as BookmarkFilled } from '@keyline-icons/react-native/fill';
import { StatusBar } from 'expo-status-bar';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { AReaderControl } from '@ValenceMobile/components/AReader/components/AReaderChrome/components/AReaderControl/AReaderControl';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { Words } from '@ValenceMobile/components/Words/Words';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { readerBarLook } from '@ValenceMobile/components/AReader/readerBarLook';
import type { AReaderChromeProps } from './AReaderChrome.types';
import { say } from '@ValenceI18n/say';

const BAR = 52;

const SOLID = 1;

const FROSTED_TINT = 0.45;

const MOVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const SIDE_WITH_MARK = 92;

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    height: BAR,
    paddingHorizontal: 4,
  },
  end: { justifyContent: 'flex-end' },
  side: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  foot: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  head: { left: 0, position: 'absolute', right: 0, top: 0 },
  titles: { alignItems: 'center', flex: 1, gap: 1 },
  whole: { flex: 1 },
});

/**
 * What every reader has around its page, as the web's reader chrome has: the way out and what is
 * being read across the top, with a button for the reader's panel of contents and settings, and how
 * far through along the bottom. The bars are drawn in the page's own paper and ink, so a sepia page
 * keeps its bars sepia, and they slide away together — with the phone's clock — to leave only the
 * page, and back when asked. They keep clear of the island and the rounded corners whichever way
 * the phone is held.
 *
 * @param title - What is being read.
 * @param place - Which chapter or section is open, where there is more than one.
 * @param paper - The colour of the page.
 * @param ink - The colour of the words on it.
 * @param isDarkPage - Whether the page is dark, so the clock is drawn light.
 * @param isShown - Whether the bars are showing.
 * @param onBack - Told somebody is done reading.
 * @param onPanel - Told to bring out the reader's panel.
 * @param footer - What goes along the bottom.
 * @param children - The page.
 * @param mark - Whether the page showing is bookmarked, and how to mark or unmark it, where the
 *   reader keeps bookmarks in its top bar.
 * @param isFrosted - Whether the bars are dark frosted glass, the page showing blurred through a
 *   light tint of the paper's colour, rather than solid.
 */
const AReaderChrome = ({
  title,
  place,
  paper,
  ink,
  isDarkPage,
  isShown,
  onBack,
  onPanel,
  footer,
  children,
  isFrosted = false,
  mark,
}: AReaderChromeProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const [showing] = useState(() => new Animated.Value(isShown ? 1 : 0));
  const topReach = room.top + BAR + 8;
  const [footTall, setFootTall] = useState(0);
  const footReach = Math.max(footTall, room.bottom + 120) + 8;

  useEffect(() => {
    if (isStill) {
      showing.setValue(isShown ? 1 : 0);

      return;
    }

    Animated.spring(showing, { ...MOVES, toValue: isShown ? 1 : 0 }).start();
  }, [isShown, isStill, showing]);

  return (
    <View style={[styles.whole, { backgroundColor: paper }]}>
      <StatusBar hidden={!isShown} style={isDarkPage ? 'light' : 'dark'} animated />

      {children}

      <Animated.View
        pointerEvents={isShown ? 'box-none' : 'none'}
        style={[
          styles.head,
          {
            backgroundColor: withAlpha(paper, isFrosted ? FROSTED_TINT : SOLID),
            paddingBottom: 8,
            paddingLeft: Math.max(SCREEN_EDGE, room.left),
            paddingRight: Math.max(SCREEN_EDGE, room.right),
            paddingTop: room.top,
            transform: [
              {
                translateY: showing.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-topReach, 0],
                }),
              },
            ],
          },
        ]}
      >
        {isFrosted ? <ABlur isDark /> : null}
        <View style={[styles.bar, readerBarLook(paper, ink, isDarkPage)]}>
          <View style={[styles.side, mark === undefined ? null : { width: SIDE_WITH_MARK }]}>
            <AReaderControl label={say('common.back')} onPress={onBack}>
              <Icon of={ChevronLeft} size={22} colour={ink} />
            </AReaderControl>
          </View>
          <View style={styles.titles}>
            <Words lines={1} isStrong colour={ink}>
              {title}
            </Words>
            {place === null ? null : (
              <Words size="small" lines={1} colour={withAlpha(ink, 0.6)}>
                {place}
              </Words>
            )}
          </View>
          <View
            style={[styles.side, styles.end, mark === undefined ? null : { width: SIDE_WITH_MARK }]}
          >
            {mark === undefined ? null : (
              <AReaderControl
                label={
                  mark.isMarked ? say('common.removeBookmark') : say('common.bookmarkThisPage')
                }
                onPress={mark.onMark}
              >
                <Icon of={mark.isMarked ? BookmarkFilled : Bookmark} size={22} colour={ink} />
              </AReaderControl>
            )}
            <AReaderControl label={say('common.contentsAndSettings')} onPress={onPanel}>
              <Icon of={SlidersHorizontal} size={22} colour={ink} />
            </AReaderControl>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={isShown ? 'box-none' : 'none'}
        onLayout={({ nativeEvent }) => {
          setFootTall(nativeEvent.layout.height);
        }}
        style={[
          styles.foot,
          {
            backgroundColor: withAlpha(paper, isFrosted ? FROSTED_TINT : SOLID),
            paddingBottom: room.bottom + 8,
            paddingLeft: Math.max(SCREEN_EDGE, room.left),
            paddingRight: Math.max(SCREEN_EDGE, room.right),
            paddingTop: 10,
            transform: [
              {
                translateY: showing.interpolate({
                  inputRange: [0, 1],
                  outputRange: [footReach, 0],
                }),
              },
            ],
          },
        ]}
      >
        {isFrosted ? <ABlur isDark /> : null}
        {footer}
      </Animated.View>
    </View>
  );
};

AReaderChrome.displayName = 'AReaderChrome';

export { AReaderChrome };
