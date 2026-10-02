import { StyleSheet, Text, View } from 'react-native';
import { monthGridOf } from '@ValenceCore/functions/monthGridOf';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheWeekday } from '@ValenceClient/calendar/nameTheWeekday';
import { Button } from '@ValenceMobile/components/Button/Button';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ACalendarMonthProps } from './ACalendarMonth.types';

const DOTS_A_DAY = 3;

const DAY = 40;

const DOT = 4;

const styles = StyleSheet.create({
  cell: { alignItems: 'center', flex: 1 },
  day: {
    alignItems: 'center',
    borderRadius: DAY / 2,
    gap: 2,
    height: DAY,
    justifyContent: 'center',
    width: DAY,
  },
  dot: { borderRadius: DOT / 2, height: DOT, width: DOT },
  dots: { flexDirection: 'row', gap: 2, height: DOT },
  grid: { gap: 4, paddingHorizontal: 4, paddingVertical: 8 },
  number: { fontFamily: FONTS.sans.medium, fontSize: 15, fontVariant: ['tabular-nums'] },
  week: { flexDirection: 'row' },
  weekday: {
    fontFamily: FONTS.sans.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

/**
 * A month of dates, Monday first, each dotted for what comes out on it, the one picked filled in
 * the accent and today written in it, so a month can be read at a glance and a day picked from it.
 *
 * @param day - The day picked, which also says which month is shown unless another is given.
 * @param month - Any day of the month to show, where it is not the picked day's.
 * @param today - Today, which is marked.
 * @param entries - What is released in the weeks shown.
 * @param onPick - Told which day was pressed.
 */
const ACalendarMonth = ({
  day,
  month: shown = day,
  today,
  entries,
  onPick,
}: ACalendarMonthProps) => {
  const colours = useTheColours();
  const grid = monthGridOf(shown);
  const month = shown.slice(0, 7);
  const weeks = Array.from({ length: grid.length / 7 }, (_, at) => grid.slice(at * 7, at * 7 + 7));

  return (
    <View style={styles.grid}>
      <View style={styles.week}>
        {grid.slice(0, 7).map((date) => (
          <View key={date} style={styles.cell}>
            <Text style={[styles.weekday, { color: colours.textMuted }]}>
              {nameTheWeekday(date)}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]} style={styles.week}>
          {week.map((date) => {
            const count = entries.filter((entry) => entry.date === date).length;
            const isPicked = date === day;
            const isToday = date === today;
            const ink = isPicked
              ? colours.accentContrast
              : isToday
                ? colours.accent
                : date.slice(0, 7) === month
                  ? colours.text
                  : colours.textMuted;

            return (
              <View key={date} style={styles.cell}>
                <Button
                  tone="bare"
                  label={nameTheDay(date, today)}
                  isChosen={isPicked}
                  onPress={() => {
                    onPick(date);
                  }}
                >
                  <View
                    style={[
                      styles.day,
                      {
                        backgroundColor: isPicked ? colours.accent : 'transparent',
                        opacity: isPicked || date.slice(0, 7) === month ? 1 : 0.45,
                      },
                    ]}
                  >
                    <Text style={[styles.number, { color: ink }]}>{Number(date.slice(8, 10))}</Text>
                    <View style={styles.dots}>
                      {Array.from({ length: Math.min(count, DOTS_A_DAY) }, (_, dot) => (
                        <View
                          key={dot}
                          style={[
                            styles.dot,
                            { backgroundColor: isPicked ? colours.accentContrast : colours.accent },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </Button>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

ACalendarMonth.displayName = 'ACalendarMonth';

export { ACalendarMonth };
