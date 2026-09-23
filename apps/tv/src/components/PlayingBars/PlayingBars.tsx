import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { listenToTheSound } from '@ValenceTv/music/listenToTheSound';
import { soundBands } from '@ValenceTv/music/soundBands';
import type { PlayingBarsProps } from './PlayingBars.types';

const BARS = [
  { lowest: 0.3, highest: 1, beatMs: 520 },
  { lowest: 0.45, highest: 0.8, beatMs: 380 },
  { lowest: 0.25, highest: 0.95, beatMs: 610 },
  { lowest: 0.4, highest: 0.7, beatMs: 450 },
] as const;

const RESTS_AT = 0.3;

const QUIETEST = 0.15;

const PEAKS_FADE = 0.996;

const FALLS_BY = 0.82;

const SILENT_AFTER_MS = 900;

/**
 * The bars that say a song is playing, as the television's music apps draw them: four thin bars,
 * from the bass at the left to the treble at the right, each rising with how loud its part of the
 * music is and falling away more slowly, settling low and still while it is paused.
 *
 * Each band is measured against the loudest it has been lately, so quiet songs move the bars as
 * much as loud ones. Where there is no sound to hear — the television is controlling another
 * device, or the system does not hand the samples over — the bars rise and fall out of step with
 * one another instead.
 *
 * @param isPlaying - Whether the song is playing rather than paused.
 * @param colour - What colour the bars are.
 * @param size - How tall and wide the bars stand together.
 */
const PlayingBars = ({ isPlaying, colour, size = 28 }: PlayingBarsProps) => {
  const heights = useRef(BARS.map(() => new Animated.Value(RESTS_AT))).current;

  const levels = useRef(BARS.map(() => RESTS_AT));
  const peaks = useRef(BARS.map(() => 0));
  const heardAt = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      const settling = Animated.parallel(
        heights.map((height) =>
          Animated.timing(height, { toValue: RESTS_AT, duration: 240, useNativeDriver: true }),
        ),
      );

      settling.start();

      return () => {
        settling.stop();
      };
    }

    const beating = Animated.parallel(
      heights.map((height, at) => {
        const bar = BARS[at] ?? BARS[0];

        return Animated.loop(
          Animated.sequence([
            Animated.timing(height, {
              toValue: bar.highest,
              duration: bar.beatMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(height, {
              toValue: bar.lowest,
              duration: bar.beatMs,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        );
      }),
    );

    let isBeating = false;

    const beatUnlessHeard = setInterval(() => {
      const isHeard = Date.now() - heardAt.current < SILENT_AFTER_MS;

      if (!isHeard && !isBeating) {
        isBeating = true;
        beating.start();
      }

      if (isHeard && isBeating) {
        isBeating = false;
        beating.stop();
      }
    }, SILENT_AFTER_MS / 3);

    const stopListening = listenToTheSound((frames) => {
      if (isBeating) {
        isBeating = false;
        beating.stop();
      }

      heardAt.current = Date.now();

      soundBands(frames).forEach((strength, at) => {
        const peak = Math.max(strength, (peaks.current[at] ?? 0) * PEAKS_FADE);
        const heard = peak > 0 ? Math.max(strength / peak, QUIETEST) : QUIETEST;
        const level = Math.max(heard, (levels.current[at] ?? RESTS_AT) * FALLS_BY);

        peaks.current[at] = peak;
        levels.current[at] = level;
        heights[at]?.setValue(level);
      });
    });

    return () => {
      clearInterval(beatUnlessHeard);
      stopListening();
      beating.stop();
    };
  }, [isPlaying, heights]);

  const width = Math.max(Math.round(size / 7), 2);

  return (
    <View style={[styles.bars, { width: size, height: size }]}>
      {heights.map((height, at) => (
        <Animated.View
          key={at}
          style={{
            width,
            height: size,
            borderRadius: width / 2,
            backgroundColor: colour,
            transformOrigin: 'bottom',
            transform: [{ scaleY: height }],
          }}
        />
      ))}
    </View>
  );
};

PlayingBars.displayName = 'PlayingBars';

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});

export { PlayingBars };
