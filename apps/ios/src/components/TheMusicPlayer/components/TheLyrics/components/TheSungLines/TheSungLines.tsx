import { memo, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { lyricStanding } from '@ValenceClient/music/lyricStanding';
import { Button } from '@ValencePhone/components/Button/Button';
import { ALyricLine } from '@ValencePhone/components/TheMusicPlayer/components/TheLyrics/components/ALyricLine/ALyricLine';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import type { TheSungLinesProps } from './TheSungLines.types';

const LEAVES_A_READER_ALONE_FOR = 4000;

const SUNG_SITS_BELOW_THE_TOP = 48;

const FADES_IN_OVER = 24;

const styles = StyleSheet.create({
  line: { paddingVertical: 8 },
  lines: { paddingBottom: 240, paddingTop: FADES_IN_OVER },
});

/**
 * A song's words, scrolled so the line being sung stays near the top unless somebody has just
 * scrolled them themselves. Pressing a timed line plays from it. It is drawn again only when the
 * line being sung changes, not with every tick of the song.
 *
 * @param lines - The words.
 * @param isSynced - Whether they are timed.
 * @param sung - The line being sung, or -1 for none.
 * @param onSeek - Told to play from a moment, where a timed line was pressed.
 */
const TheLines = ({ lines, isSynced, sung, onSeek }: TheSungLinesProps) => {
  const isStill = usePrefersStillness();
  const scrolling = useRef<ScrollView>(null);
  const [places, setPlaces] = useState<ReadonlyMap<number, number>>(new Map());
  const [lastTouchedAt, setLastTouchedAt] = useState(0);
  const sungAt = places.get(sung);

  useEffect(() => {
    if (sungAt === undefined || Date.now() - lastTouchedAt < LEAVES_A_READER_ALONE_FOR) {
      return;
    }

    scrolling.current?.scrollTo({
      y: Math.max(sungAt - SUNG_SITS_BELOW_THE_TOP, 0),
      animated: !isStill,
    });
  }, [sungAt, lastTouchedAt, isStill]);

  return (
    <ScrollView
      ref={scrolling}
      contentContainerStyle={styles.lines}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={() => {
        setLastTouchedAt(Date.now());
      }}
    >
      {lines.map((line, at) => {
        const said = (
          <View
            style={styles.line}
            onLayout={({ nativeEvent }) => {
              const { y } = nativeEvent.layout;

              setPlaces((was) => (was.get(at) === y ? was : new Map(was).set(at, y)));
            }}
          >
            <ALyricLine
              words={line.text === '' ? '♪' : line.text}
              standing={lyricStanding(at, sung, isSynced, true)}
              isStill={isStill}
            />
          </View>
        );
        const { atMs } = line;

        return isSynced && atMs !== null ? (
          <Button
            key={`${at.toString()}:${line.text}`}
            tone="bare"
            label={`Play from “${line.text}”`}
            onPress={() => {
              setLastTouchedAt(0);
              onSeek(atMs / 1000);
            }}
          >
            {said}
          </Button>
        ) : (
          <View key={`${at.toString()}:${line.text}`}>{said}</View>
        );
      })}
    </ScrollView>
  );
};

const TheSungLines = memo(TheLines);

TheSungLines.displayName = 'TheSungLines';

export { TheSungLines };
