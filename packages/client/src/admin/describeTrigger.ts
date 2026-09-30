import type { ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';
import { say } from '@ValenceI18n/say';

const DAY_NAMES = [
  say('client.admin.describeTrigger.sunday'),
  say('client.admin.describeTrigger.monday'),
  say('client.admin.describeTrigger.tuesday'),
  say('client.admin.describeTrigger.wednesday'),
  say('client.admin.describeTrigger.thursday'),
  say('client.admin.describeTrigger.friday'),
  say('client.admin.describeTrigger.saturday'),
] as const;

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
      return say('common.onApplicationStartup');
    case 'everyMinutes':
      return trigger.minutes === 1
        ? say('client.admin.describeTrigger.everyMinute')
        : say('client.admin.describeTrigger.everyMinutesMinutes', {
            minutes: trigger.minutes.toString(),
          });
    case 'everyHours':
      return trigger.hours === 1
        ? say('client.admin.describeTrigger.everyHour')
        : say('client.admin.describeTrigger.everyHoursHours', { hours: trigger.hours.toString() });
    case 'daily':
      return say('client.admin.describeTrigger.dailyAtHour', {
        hour: toClock(trigger.hour, trigger.minute),
      });
    case 'weekly':
      return say('common.dayAtTime', {
        day: DAY_NAMES[trigger.dayOfWeek] ?? say('common.weekly'),
        time: toClock(trigger.hour, trigger.minute),
      });
  }
};

export { describeTrigger, DAY_NAMES, toClock };
