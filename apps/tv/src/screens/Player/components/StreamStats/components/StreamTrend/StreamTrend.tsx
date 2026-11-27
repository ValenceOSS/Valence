import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { StreamTrendProps } from './StreamTrend.types';
import { say } from '@ValenceI18n/say';

const CHART_HEIGHT = 90;

const OLDER_BARS_FADE_TO = 0.55;

/**
 * One reading over the last minute, as the web's stream statistics chart it, drawn as a bar a
 * reading so the television needs nothing but plain views: the newest on the right, each reading's
 * height against a fixed top, so a flat line does not look dramatic, with the newest figure large at
 * the head and the top of the scale written above the bars.
 *
 * @param title - What is measured.
 * @param label - What is measured over what span, read out to anybody who cannot see the chart.
 * @param values - The readings, oldest first; one not taken is left as a gap.
 * @param ceiling - The top of the scale.
 * @param scale - The top of the scale, written out.
 * @param newest - The newest reading, written out, or nothing where it is not known.
 * @param slots - How many readings the chart has room for, so it fills from the right.
 */
const StreamTrend = ({ title, label, values, ceiling, scale, newest, slots }: StreamTrendProps) => {
  const shown = values.slice(-slots);
  const bars = [...Array.from({ length: slots - shown.length }, () => null), ...shown];
  const hasAny = shown.some((value) => value !== null);

  return (
    <View style={styles.card} accessible accessibilityRole="image" accessibilityLabel={label}>
      <View style={styles.head}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.newest, newest === null && styles.unknown]}>
          {newest ?? '—'}
        </Text>
      </View>

      <Text style={styles.scale}>{scale}</Text>

      <View style={styles.chart}>
        <View style={[styles.line, styles.top]} />
        <View style={[styles.line, styles.middle]} />

        {hasAny ? (
          bars.map((value, at) => (
            <View key={at} style={styles.slot}>
              {value === null ? null : (
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.min(1, Math.max(0, value / Math.max(ceiling, 1))) * CHART_HEIGHT,
                      opacity: at === bars.length - 1 ? 1 : OLDER_BARS_FADE_TO,
                    },
                  ]}
                />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.nothing}>{say('ui.trendChart.nothingMeasuredYet')}</Text>
        )}
      </View>
    </View>
  );
};

StreamTrend.displayName = 'StreamTrend';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 4,
    padding: tokens.space.sm,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: tokens.space.sm },
  title: { flex: 1, color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '700' },
  newest: {
    color: tokens.colours.accent,
    fontSize: tokens.type.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unknown: { color: tokens.colours.muted, fontWeight: '400' },
  scale: {
    alignSelf: 'flex-end',
    color: tokens.colours.muted,
    fontSize: tokens.type.small - 2,
    fontVariant: ['tabular-nums'],
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colours.line,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colours.line,
  },
  top: { top: 0 },
  middle: { top: CHART_HEIGHT / 2 },
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    minHeight: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: tokens.colours.accent,
  },
  nothing: {
    flex: 1,
    alignSelf: 'center',
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
  },
});

export { StreamTrend };
