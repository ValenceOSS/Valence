import { useRef } from 'react';
import type { ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { nameTheShortMonth } from '@ValenceClient/calendar/nameTheShortMonth';
import { nameTheWeekday } from '@ValenceClient/calendar/nameTheWeekday';
import { timelineDaysOf } from '@ValenceClient/calendar/timelineDaysOf';
import { timelineRowsOf } from '@ValenceClient/calendar/timelineRowsOf';
import type { ACalendarTimelineProps } from './ACalendarTimeline.types';

const DAY_WIDE = 46;

const ROW_TALL = 46;

const HEAD_TALL = 70;

const styles = StyleSheet.create({
  bar: {
    borderRadius: 10,
    height: ROW_TALL - 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
    position: 'absolute',
  },
  barTitle: { fontFamily: FONTS.sans.bold, fontSize: 13 },
  day: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 22,
    width: DAY_WIDE - 6,
  },
  dayNumber: { fontFamily: FONTS.sans.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  month: {
    fontFamily: FONTS.sans.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    position: 'absolute',
    textTransform: 'uppercase',
    top: 2,
  },
  today: {
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    bottom: 0,
    position: 'absolute',
    top: HEAD_TALL,
  },
  weekday: {
    fontFamily: FONTS.sans.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  whole: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});

/**
 * The release calendar as a timeline, as the web lays it out: five weeks of days along the top with
 * the months above them, and a bar for each show or film running from its first release in those
 * weeks to its last, today's column shaded with a dashed line down it. It scrolls sideways, opening
 * with today in view, and a bar opens what it is for.
 *
 * @param day - The day the calendar is turned to.
 * @param today - Today, which is marked.
 * @param entries - What is released in the weeks shown.
 * @param onOpen - Opens an entry.
 */
const ACalendarTimeline = ({ day, today, entries, onOpen }: ACalendarTimelineProps) => {
  const colours = useTheColours();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const days = timelineDaysOf(day);
  const rows = timelineRowsOf(entries);
  const todayAt = days.indexOf(today);
  const columnOf = (date: string) => Math.max(days.indexOf(date), 0);
  const wide = days.length * DAY_WIDE;
  const tall = HEAD_TALL + Math.max(rows.length, 3) * ROW_TALL + 12;

  return (
    <View
      style={[
        styles.whole,
        { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
      ]}
    >
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          if (todayAt >= 0) {
            scroller.current?.scrollTo({
              x: Math.max(
                0,
                todayAt * DAY_WIDE - event.nativeEvent.layout.width / 2 + DAY_WIDE / 2,
              ),
              animated: false,
            });
          }
        }}
      >
        <View style={{ height: tall, width: wide }}>
          {todayAt < 0 ? null : (
            <>
              <View
                style={{
                  backgroundColor: withAlpha(colours.text, 0.05),
                  bottom: 0,
                  left: todayAt * DAY_WIDE,
                  position: 'absolute',
                  top: HEAD_TALL - 4,
                  width: DAY_WIDE,
                }}
              />
              <View
                style={[
                  styles.today,
                  {
                    borderColor: withAlpha(colours.text, 0.3),
                    left: todayAt * DAY_WIDE + DAY_WIDE / 2,
                  },
                ]}
              />
            </>
          )}

          {days.map((date, at) =>
            at === 0 || date.endsWith('-01') ? (
              <Text
                key={`month:${date}`}
                style={[styles.month, { color: colours.textMuted, left: at * DAY_WIDE + 8 }]}
              >
                {nameTheShortMonth(date)}
              </Text>
            ) : null,
          )}

          {days.map((date, at) => {
            const isToday = date === today;

            return (
              <View
                key={`day:${date}`}
                style={[
                  styles.day,
                  { left: at * DAY_WIDE + 3, opacity: date < today && !isToday ? 0.55 : 1 },
                  isToday ? { backgroundColor: colours.text } : null,
                ]}
              >
                <Text
                  style={[styles.weekday, { color: isToday ? colours.surface : colours.textMuted }]}
                >
                  {nameTheWeekday(date)}
                </Text>
                <Text
                  style={[styles.dayNumber, { color: isToday ? colours.surface : colours.text }]}
                >
                  {Number(date.slice(8, 10))}
                </Text>
              </View>
            );
          })}

          {rows.map((row, at) => {
            const start = columnOf(row.first);
            const span = Math.max(columnOf(row.last) - start + 1, 1);
            const first = row.entries[0];

            return (
              <View
                key={row.key}
                style={[
                  styles.bar,
                  {
                    backgroundColor: withAlpha(colours.accent, row.last < today ? 0.12 : 0.2),
                    left: start * DAY_WIDE + 4,
                    top: HEAD_TALL + at * ROW_TALL + 6,
                    width: Math.max(span * DAY_WIDE - 8, 120),
                  },
                ]}
              >
                <Button
                  tone="bare"
                  label={row.title}
                  onPress={() => {
                    if (first !== undefined) {
                      onOpen(first);
                    }
                  }}
                >
                  <Text style={[styles.barTitle, { color: colours.text }]} numberOfLines={1}>
                    {row.title}
                  </Text>
                </Button>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

ACalendarTimeline.displayName = 'ACalendarTimeline';

export { ACalendarTimeline };
