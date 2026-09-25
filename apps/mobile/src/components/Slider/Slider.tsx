import { useCallback, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { whereAlongTheLine } from './whereAlongTheLine';
import type { SliderProps } from './Slider.types';

const THUMB = 14;

const TRACK = 4;

const HELD_TRACK = 7;

const A_STEP = 10;

const styles = StyleSheet.create({
  filled: { bottom: 0, left: 0, position: 'absolute', top: 0 },
  room: { justifyContent: 'center', paddingVertical: 14 },
  thumb: { borderRadius: THUMB, height: THUMB, position: 'absolute', width: THUMB },
  track: { borderRadius: HELD_TRACK, justifyContent: 'center', overflow: 'hidden' },
});

/**
 * The one thing on a phone that takes a drag along a line.
 *
 * It draws three things over one another: how far the stream has been fetched, how far the viewer
 * has got, and where their thumb is. The middle one is the reason this is written rather than
 * taken off a shelf — a scrubber that cannot say what has already arrived tells somebody waiting
 * that nothing is happening.
 *
 * What it shows while a finger is down is the finger, not the film. Following the player during a
 * drag fights whoever is dragging, and a scrubber that argues is a scrubber nobody can land.
 *
 * Nothing drawn on it takes a touch, so every touch is reported against the whole line. A thumb
 * that could be touched would report a position relative to itself, which is fourteen pixels wide
 * and would read every drag as landing in the same place.
 *
 * @param label - What is being scrubbed through, for anybody who cannot see it.
 * @param value - Where the thing is now.
 * @param furthest - How far it goes.
 * @param buffered - How much of it has arrived, where that is known.
 * @param colour - How far they have got.
 * @param restColour - The rest of it.
 * @param aheadColour - What has arrived but not been watched.
 * @param onScrubbing - Told where their thumb is, as it moves.
 * @param onScrubbed - Told where they let go.
 */
const Slider = ({
  label,
  value,
  furthest,
  buffered = 0,
  colour,
  restColour,
  aheadColour,
  onScrubbing,
  onScrubbed,
}: SliderProps) => {
  const [width, setWidth] = useState(0);
  const [scrubbingTo, setScrubbingTo] = useState<number | null>(null);

  const hold = useCallback(
    (at: number) => {
      setScrubbingTo(at);
      onScrubbing?.(at);
    },
    [onScrubbing],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          hold(whereAlongTheLine(event.nativeEvent.locationX, width, furthest));
        },
        onPanResponderMove: (event) => {
          hold(whereAlongTheLine(event.nativeEvent.locationX, width, furthest));
        },
        onPanResponderRelease: (event) => {
          setScrubbingTo(null);
          onScrubbed(whereAlongTheLine(event.nativeEvent.locationX, width, furthest));
        },
        onPanResponderTerminate: () => {
          setScrubbingTo(null);
        },
      }),
    [width, furthest, hold, onScrubbed],
  );

  const showing = scrubbingTo ?? value;
  const howFar = furthest === 0 ? 0 : whereAlongTheLine(showing, furthest, 1);
  const howMuchArrived = furthest === 0 ? 0 : whereAlongTheLine(buffered, furthest, 1);
  const isHeld = scrubbingTo !== null;

  return (
    <View
      style={styles.room}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: Math.round(furthest), now: Math.round(showing) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        const step = nativeEvent.actionName === 'increment' ? A_STEP : -A_STEP;

        onScrubbed(Math.min(Math.max(value + step, 0), furthest));
      }}
      onLayout={({ nativeEvent }: LayoutChangeEvent) => {
        setWidth(nativeEvent.layout.width);
      }}
      {...responder.panHandlers}
    >
      <View
        style={[styles.track, { backgroundColor: restColour, height: isHeld ? HELD_TRACK : TRACK }]}
      >
        <View
          style={[styles.filled, { backgroundColor: aheadColour, width: width * howMuchArrived }]}
        />
        <View style={[styles.filled, { backgroundColor: colour, width: width * howFar }]} />
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            backgroundColor: colour,
            left: width * howFar - THUMB / 2,
            transform: [{ scale: isHeld ? 1.3 : 1 }],
          },
        ]}
      />
    </View>
  );
};

Slider.displayName = 'Slider';

export { Slider };
