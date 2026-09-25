import type { ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';

const DAY_KEYS = [
  'client.describeTrigger.sunday',
  'client.describeTrigger.monday',
  'client.describeTrigger.tuesday',
  'client.describeTrigger.wednesday',
  'client.describeTrigger.thursday',
  'client.describeTrigger.friday',
  'client.describeTrigger.saturday',
] as const satisfies readonly StringKey[];

const DAY_NAMES: readonly string[] = DAY_KEYS.reduce<string[]>(
  (names, key, index) =>
    Object.defineProperty(names, index, { enumerable: true, get: () => say(key) }),
  [],
);

/**
 * Writes an hour and minute as a clock time, padded, for a schedule an operator reads.
 *
 * @param hour - The hour, from zero.
 * @param minute - The minute, from zero.
 * @returns The time as `HH:MM`.
 */
const toClock = (hour: number, minute: number): string =>
  `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

/**
 * Says what a trigger does in the words an operator set it in — every four hours, daily at 03:00,
 * Sundays at midnight — rather than as the cron expression it becomes.
 *
 * @param trigger - The trigger as configured.
 * @returns The schedule as a sentence.
 */
const describeTrigger = (trigger: ScheduleTrigger): string => {
  switch (trigger.kind) {
    case 'startup':
      return say('client.describeTrigger.startup');
    case 'everyMinutes':
      return sayCount('client.describeTrigger.everyMinutes', trigger.minutes);
    case 'everyHours':
      return sayCount('client.describeTrigger.everyHours', trigger.hours);
    case 'daily':
      return say('client.describeTrigger.daily', { time: toClock(trigger.hour, trigger.minute) });
    case 'weekly': {
      const day = DAY_NAMES[trigger.dayOfWeek];
      const time = toClock(trigger.hour, trigger.minute);

      return day === undefined
        ? say('client.describeTrigger.weeklyAt', { time })
        : say('client.describeTrigger.weekly', { day, time });
    }
  }
};

export { describeTrigger, DAY_NAMES, toClock };
