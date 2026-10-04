import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SIDE_PANEL } from '@ValenceMobile/components/ASidePanel/SIDE_PANEL';
import type { ASharedTimelineProps } from './ASharedTimeline.types';

const FACE = 22;

const styles = StyleSheet.create({
  bar: { borderRadius: 2, height: 4, overflow: 'hidden' },
  face: {
    alignItems: 'center',
    borderRadius: FACE / 2,
    borderWidth: 2,
    height: FACE,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: FACE,
  },
  faces: { height: FACE + 4 },
  filled: { bottom: 0, left: 0, position: 'absolute', top: 0 },
  initial: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  times: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 },
  timeline: { gap: 4, paddingVertical: 8 },
});

/**
 * One bar for a title several people are watching together, as the web draws it: each person's
 * initial at the point they have reached, the bar filled to whoever keeps time, and the time along
 * and the time in all beneath it. The one keeping time is ringed in white.
 *
 * @param label - What the bar shows, for somebody who cannot see it.
 * @param durationSeconds - How long the title is.
 * @param filledSeconds - How far the one keeping time has reached.
 * @param people - Who is where.
 * @param elapsed - How far along, said as a time.
 * @param total - How long it is, said as a time.
 */
const ASharedTimeline = ({
  label,
  durationSeconds,
  filledSeconds,
  people,
  elapsed,
  total,
}: ASharedTimelineProps) => {
  const [wide, setWide] = useState(0);
  const along = (seconds: number) =>
    Math.min(Math.max(seconds / Math.max(durationSeconds, 1), 0), 1);

  return (
    <View
      style={styles.timeline}
      accessible
      accessibilityLabel={label}
      onLayout={(event) => {
        setWide(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.faces}>
        {people.map((person) => (
          <View
            key={person.id}
            accessible
            accessibilityLabel={person.label}
            style={[
              styles.face,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.24)',
                borderColor: person.isTimekeeper ? '#ffffff' : 'transparent',
                left: along(person.atSeconds) * Math.max(wide - FACE, 0),
              },
            ]}
          >
            <Text style={styles.initial}>{person.initial}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.bar, { backgroundColor: 'rgba(255, 255, 255, 0.16)' }]}>
        <View
          style={[
            styles.filled,
            { backgroundColor: '#ffffff', width: `${(along(filledSeconds) * 100).toFixed(2)}%` },
          ]}
        />
      </View>

      <View style={styles.times}>
        <Text style={SIDE_PANEL.styles.detail}>{elapsed}</Text>
        <Text style={SIDE_PANEL.styles.detail}>{total}</Text>
      </View>
    </View>
  );
};

ASharedTimeline.displayName = 'ASharedTimeline';

export { ASharedTimeline };
