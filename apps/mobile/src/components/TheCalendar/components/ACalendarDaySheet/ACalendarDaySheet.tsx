import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from '@keyline-icons/react-native';
import { addDays } from '@ValenceCore/functions/addDays';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { AGlassCircle } from '@ValenceMobile/components/AGlassCircle/AGlassCircle';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ACalendarMonth } from '@ValenceMobile/components/TheCalendar/components/ACalendarMonth/ACalendarMonth';
import { say } from '@ValenceI18n/say';
import type { ACalendarDaySheetProps } from './ACalendarDaySheet.types';

const NO_ENTRIES = [] as const;

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  turns: { flexDirection: 'row', gap: 8 },
  whole: { gap: 16 },
});

/**
 * A sheet for turning the release calendar to any day: a month of days to pick from, turned a month
 * at a time without moving the calendar beneath, and a way straight back to today. It opens on the
 * month the calendar is turned to, and is put away once a day is picked.
 *
 * @param isOpen - Whether it is out.
 * @param day - The day the calendar is turned to.
 * @param today - Today.
 * @param onPick - Told which day was picked.
 * @param onClose - Told to put it away.
 */
const ACalendarDaySheet = ({ isOpen, day, today, onPick, onClose }: ACalendarDaySheetProps) => {
  const [month, setMonth] = useState(day);
  const first = `${month.slice(0, 7)}-01`;

  useEffect(() => {
    if (isOpen) {
      setMonth(day);
    }
  }, [isOpen, day]);

  const pick = (picked: string) => {
    onPick(picked);
    onClose();
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={say('common.goToADay')}
      onClose={onClose}
      footer={
        <Button
          tone="bold"
          fills
          onPress={() => {
            pick(today);
          }}
        >
          {say('common.today')}
        </Button>
      }
    >
      <View style={styles.whole}>
        <View style={styles.head}>
          <Words size="heading">{nameTheMonth(month)}</Words>
          <View style={styles.turns}>
            <AGlassCircle
              of={ChevronLeft}
              label={say('common.previous')}
              onPress={() => {
                setMonth(`${addDays(first, -1).slice(0, 7)}-01`);
              }}
            />
            <AGlassCircle
              of={ChevronRight}
              label={say('common.next')}
              onPress={() => {
                setMonth(`${addDays(first, 31).slice(0, 7)}-01`);
              }}
            />
          </View>
        </View>

        <ACalendarMonth day={day} month={month} today={today} entries={NO_ENTRIES} onPick={pick} />
      </View>
    </ASheet>
  );
};

ACalendarDaySheet.displayName = 'ACalendarDaySheet';

export { ACalendarDaySheet };
