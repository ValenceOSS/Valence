import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { lyricStanding } from '@ValenceClient/music/lyricStanding';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AFadedEdge } from '@ValencePhone/components/AFadedEdge/AFadedEdge';
import { Button } from '@ValencePhone/components/Button/Button';
import { ALyricLine } from '@ValencePhone/components/TheMusicPlayer/components/TheLyrics/components/ALyricLine/ALyricLine';
import { Words } from '@ValencePhone/components/Words/Words';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLyricsProps } from './TheLyrics.types';

const LEAVES_A_READER_ALONE_FOR = 4000;

const SUNG_SITS_BELOW_THE_TOP = 48;

const FADES_IN_OVER = 24;

const FADES_OUT_OVER = 64;

const styles = StyleSheet.create({
  line: { paddingVertical: 8 },
  lines: { paddingBottom: 240, paddingTop: FADES_IN_OVER },
});

/**
 * A track's words, the way Apple Music shows them in place of the cover and the web's immersive
 * music shows them over it: large, with the line being sung bright and sharp and the rest dimmed and
 * out of focus the further they are from it, carried up the screen as the song goes so the line
 * being sung stays near the top. The words fade out at the top and bottom rather than being cut off.
 * Pressing a line of timed words plays from it. Somebody scrolling through the words is left to it
 * for a moment before the song takes the words back.
 *
 * Words that are not timed are simply there, all of them evenly lit.
 *
 * @param trackId - Whose words.
 * @param atSeconds - Where the track is.
 * @param onSeek - Told to play from a moment, where a timed line was pressed.
 */
const TheLyrics = ({ trackId, atSeconds, onSeek }: TheLyricsProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const read = useQuery(musicQueries.lyrics(trackId));
  const scrolling = useRef<ScrollView>(null);
  const [places, setPlaces] = useState<ReadonlyMap<number, number>>(new Map());
  const [lastTouchedAt, setLastTouchedAt] = useState(0);
  const lines = read.data?.lines ?? [];
  const isSynced = read.data?.isSynced === true;
  const sung = isSynced ? lyricLineAt(lines, atSeconds * 1000) : -1;
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

  if (read.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (lines.length === 0) {
    return (
      <Words tone="muted" isCentred>
        There are no words for this one.
      </Words>
    );
  }

  return (
    <AFadedEdge leading={FADES_IN_OVER} trailing={FADES_OUT_OVER} isUpright>
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
    </AFadedEdge>
  );
};

TheLyrics.displayName = 'TheLyrics';

export { TheLyrics };
