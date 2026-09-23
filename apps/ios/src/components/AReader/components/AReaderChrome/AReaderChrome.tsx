import { useEffect, useState } from 'react';
import { ChevronLeft, SlidersHorizontal } from '@keyline-icons/react-native';
import { StatusBar } from 'expo-status-bar';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AGlassCircle } from '@ValencePhone/components/AGlassCircle/AGlassCircle';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { Words } from '@ValencePhone/components/Words/Words';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { AReaderChromeProps } from './AReaderChrome.types';

const BAR = 56;

const MOVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', gap: 12, height: BAR },
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
}: AReaderChromeProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const [showing] = useState(() => new Animated.Value(isShown ? 1 : 0));
  const topReach = room.top + BAR + 8;
  const footReach = room.bottom + 120;

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
            backgroundColor: withAlpha(paper, 0.94),
            paddingLeft: Math.max(12, room.left),
            paddingRight: Math.max(12, room.right),
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
        <View style={styles.bar}>
          <AGlassCircle of={ChevronLeft} label="Back" onPress={onBack} />
          <View style={styles.titles}>
            <Words lines={1} isStrong colour={ink}>
              {title}
            </Words>
            {place === null ? null : (
              <Words size="small" lines={1} colour={withAlpha(ink, 0.7)}>
                {place}
              </Words>
            )}
          </View>
          <AGlassCircle of={SlidersHorizontal} label="Contents and settings" onPress={onPanel} />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={isShown ? 'box-none' : 'none'}
        style={[
          styles.foot,
          {
            backgroundColor: withAlpha(paper, 0.94),
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
        {footer}
      </Animated.View>
    </View>
  );
};

AReaderChrome.displayName = 'AReaderChrome';

export { AReaderChrome };
