import { useCallback, useState } from 'react';
import { StyleSheet, Text, useTVEventHandler, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { useRemoteRing } from '@ValenceTv/remote/useRemoteRing';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HWEvent } from 'react-native';
import { say } from '@ValenceI18n/say';
import type { ScrubberProps } from './Scrubber.types';

const MOVES_BY = 10;

const A_TURN_MOVES = 60;

const THICK = 14;

/**
 * How far through a song or a chapter it is: a bar filling as it plays, with the time gone at its
 * left and the time left at its right. The remote can land on it, which thickens it within the room
 * it always keeps, so nothing around it moves; left and right then move it on or back ten seconds,
 * and turning a thumb round the remote's ring moves it smoothly.
 *
 * @param position - How far through it is, in seconds.
 * @param duration - How long it is, in seconds.
 * @param onSeek - Told where to go, in seconds.
 * @param onFocus - Told when the remote lands on it.
 * @param ref - Handed the bar, for something that has to send the remote to it.
 */
const Scrubber = ({ position, duration, onSeek, onFocus, ref }: ScrubberProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const through = duration > 0 ? Math.min(Math.max(position / duration, 0), 1) : 0;

  const moveBy = useCallback(
    (seconds: number) => {
      if (duration > 0) {
        onSeek(Math.min(Math.max(position + seconds, 0), duration));
      }
    },
    [duration, onSeek, position],
  );

  const hear = useCallback(
    (event: HWEvent) => {
      if (!isFocused) {
        return;
      }

      if (event.eventType === 'left') {
        moveBy(-MOVES_BY);
      }

      if (event.eventType === 'right') {
        moveBy(MOVES_BY);
      }
    },
    [isFocused, moveBy],
  );

  useTVEventHandler(hear);
  useRemoteRing(isFocused, (degrees) => {
    moveBy((degrees / 360) * A_TURN_MOVES);
  });

  return (
    <Focusable
      ref={ref}
      label={say('tv.scrubber.positionOf', {
        position: formatDuration(position),
        duration: formatDuration(duration),
      })}
      scale={1}
      onFocus={() => {
        setIsFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
    >
      <View style={styles.bar}>
        <View style={styles.slot}>
          <View style={[styles.track, isFocused && styles.thick]}>
            <View style={[styles.gone, { flex: through }]} />
            <View style={{ flex: 1 - through }} />
          </View>
        </View>

        <View style={styles.times}>
          <Text style={styles.time}>{formatDuration(position)}</Text>
          <Text style={styles.time}>-{formatDuration(Math.max(duration - position, 0))}</Text>
        </View>
      </View>
    </Focusable>
  );
};

Scrubber.displayName = 'Scrubber';

const styles = StyleSheet.create({
  bar: { gap: tokens.space.xs, paddingVertical: tokens.space.xs },
  slot: { height: THICK, justifyContent: 'center' },
  track: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  thick: { height: THICK, borderRadius: THICK / 2 },
  gone: { backgroundColor: '#ffffff' },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: tokens.type.small,
    fontVariant: ['tabular-nums'],
  },
});

export { Scrubber };
