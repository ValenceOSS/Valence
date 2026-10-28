import { StyleSheet, Text, View } from 'react-native';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TimeBarProps } from './TimeBar.types';

const HALF_HOUR_MS = 30 * 60 * 1000;

const NOW_SIZE = 12;

/**
 * The times along the top of the guide, one at each half hour of the stretch showing, set over the
 * programmes that start then.
 *
 * @param from - Where the stretch starts, in milliseconds.
 * @param until - Where it ends.
 * @param width - How wide the stretch is drawn.
 * @param nowAt - How far along the stretch this minute is, where it is in the stretch at all.
 */
const TimeBar = ({ from, until, width, nowAt }: TimeBarProps) => {
  const first = Math.ceil(from / HALF_HOUR_MS) * HALF_HOUR_MS;
  const marks = Array.from(
    { length: Math.max(Math.ceil((until - first) / HALF_HOUR_MS), 0) },
    (_, index) => first + index * HALF_HOUR_MS,
  );

  return (
    <View style={[styles.bar, { width }]}>
      {marks.map((mark) => (
        <Text key={mark} style={[styles.time, { left: ((mark - from) / (until - from)) * width }]}>
          {liveClockTime(new Date(mark).toISOString())}
        </Text>
      ))}

      {nowAt === null ? null : <View style={[styles.now, { left: nowAt - NOW_SIZE / 2 }]} />}
    </View>
  );
};

TimeBar.displayName = 'TimeBar';

const styles = StyleSheet.create({
  bar: { height: 40 },
  now: {
    position: 'absolute',
    bottom: -NOW_SIZE / 2,
    width: NOW_SIZE,
    height: NOW_SIZE,
    borderRadius: NOW_SIZE / 2,
    backgroundColor: tokens.colours.accent,
  },
  time: {
    position: 'absolute',
    paddingLeft: tokens.space.sm,
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
  },
});

export { TimeBar };
