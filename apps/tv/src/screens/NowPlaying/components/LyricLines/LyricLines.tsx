import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { tokens } from '@ValenceTv/theme/tokens';
import { GapDots } from './components/GapDots/GapDots';
import { LyricLine } from './components/LyricLine/LyricLine';
import type { LyricLinesProps } from './LyricLines.types';

const GAP_FROM_MS = 4000;

const FOLLOWS_AGAIN_AFTER_MS = 5000;

const SUNG_AT = 0.32;

type Shown =
  | { kind: 'words'; text: string; atMs: number | null }
  | { kind: 'gap'; atMs: number; untilMs: number };

/**
 * The lines to draw: the words, with a row of dots wherever nothing is sung for a while — before
 * the first line, and wherever a timed line is empty — and short empty lines left out.
 *
 * @param lines - The words as the server has them.
 * @returns What to draw, in order.
 */
const shownLines = (lines: LyricLinesProps['lyrics']['lines']): Shown[] => {
  const shown: Shown[] = [];
  const first = lines[0]?.atMs ?? null;

  if (first !== null && first >= GAP_FROM_MS) {
    shown.push({ kind: 'gap', atMs: 0, untilMs: first });
  }

  for (const [at, line] of lines.entries()) {
    if (line.text.trim() !== '') {
      shown.push({ kind: 'words', text: line.text, atMs: line.atMs });
      continue;
    }

    const next = lines[at + 1]?.atMs ?? null;

    if (line.atMs !== null && next !== null && next - line.atMs >= GAP_FROM_MS) {
      shown.push({ kind: 'gap', atMs: line.atMs, untilMs: next });
    }
  }

  return shown;
};

/**
 * The words of what is playing, filling the side of the screen as the television's own music app
 * shows them: the line being sung lit, those either side dimmed the further they are from it, the
 * column melting away at its top and foot, and gliding up so the sung line keeps its place a third
 * of the way down, with dots standing in for the stretches with
 * nothing sung.
 *
 * Moving the remote up or down steps through the lines instead — the column follows the remote
 * rather than the song until it has been left alone a few seconds — and pressing a line goes to
 * where it is sung. Words that are not timed are shown whole, for the remote to move through.
 *
 * @param lyrics - The words.
 * @param positionMs - How far through the song it is.
 * @param onSeek - Told where in the song to go, in seconds.
 */
const LyricLines = ({ lyrics, positionMs, onSeek }: LyricLinesProps) => {
  const shown = useMemo(() => shownLines(lyrics.lines), [lyrics.lines]);
  const timed = useMemo(
    () => shown.map((line) => ({ atMs: line.atMs, text: line.kind === 'words' ? line.text : '' })),
    [shown],
  );
  const sung = lyrics.isSynced ? lyricLineAt(timed, positionMs) : -1;
  const [browsed, setBrowsed] = useState<{ at: number; since: number } | null>(null);
  const [room, setRoom] = useState(0);
  const places = useRef(new Map<number, { top: number; height: number }>());
  const [measured, setMeasured] = useState(0);
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (browsed === null) {
      return;
    }

    const timer = setTimeout(() => {
      setBrowsed(null);
    }, FOLLOWS_AGAIN_AFTER_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [browsed]);

  const followed = browsed?.at ?? Math.max(sung, 0);

  useEffect(() => {
    const place = places.current.get(followed);

    if (place === undefined || room === 0) {
      return;
    }

    Animated.spring(lift, {
      toValue: -(place.top + place.height / 2 - room * SUNG_AT),
      damping: 26,
      stiffness: 120,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [followed, room, measured, lift]);

  const measure = useCallback((at: number, top: number, height: number) => {
    places.current.set(at, { top, height });
    setMeasured((was) => was + 1);
  }, []);

  return (
    <EdgeFade edge="bottom" reach={0.3} style={styles.room}>
      <EdgeFade edge="top" reach={0.18} style={styles.room}>
        <View
          style={styles.room}
          onLayout={(event) => {
            setRoom(event.nativeEvent.layout.height);
          }}
        >
          <Animated.View style={[styles.column, { transform: [{ translateY: lift }] }]}>
            {shown.map((line, at) => {
              if (line.kind === 'gap') {
                const through =
                  at === sung
                    ? (positionMs - line.atMs) / Math.max(line.untilMs - line.atMs, 1)
                    : 0;

                return (
                  <View
                    key={`gap:${line.atMs.toString()}`}
                    collapsable={false}
                    style={at === sung ? undefined : styles.quietGap}
                    onLayout={(event) => {
                      measure(at, event.nativeEvent.layout.y, event.nativeEvent.layout.height);
                    }}
                  >
                    <GapDots through={through} />
                  </View>
                );
              }

              const { atMs } = line;

              return (
                <LyricLine
                  key={`${at.toString()}:${line.text}`}
                  text={line.text}
                  distance={lyrics.isSynced ? at - sung : 0}
                  canSeek={atMs !== null}
                  onPress={() => {
                    if (atMs !== null) {
                      setBrowsed(null);
                      onSeek(atMs / 1000);
                    }
                  }}
                  onFocus={() => {
                    setBrowsed({ at, since: Date.now() });
                  }}
                  onLayout={(top, height) => {
                    measure(at, top, height);
                  }}
                />
              );
            })}
          </Animated.View>
        </View>
      </EdgeFade>
    </EdgeFade>
  );
};

LyricLines.displayName = 'LyricLines';

const styles = StyleSheet.create({
  room: { flex: 1, overflow: 'hidden' },
  column: { gap: tokens.space.xs, paddingBottom: 600 },
  quietGap: { opacity: 0.4 },
});

export { LyricLines };
