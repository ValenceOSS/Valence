import { instantOf } from '@ValenceClient/admin/instantOf';
import { offsetAt } from '@ValenceClient/admin/offsetAt';
import type { ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Finds the next wall-clock reading after `wall` at which one trigger fires, reading the trigger
 * as the cron it becomes: steps of minutes or hours count from the top of the hour or the day.
 *
 * @param trigger - The trigger.
 * @param wall - The zone's wall clock now, as UTC parts.
 * @returns The next reading, as UTC parts, or null for a trigger that only fires at startup.
 */
const nextWallOf = (trigger: ScheduleTrigger, wall: number): number | null => {
  const minute = Math.floor(wall / MINUTE) * MINUTE;
  const hour = Math.floor(wall / HOUR) * HOUR;
  const day = Math.floor(wall / DAY) * DAY;

  switch (trigger.kind) {
    case 'startup':
      return null;
    case 'everyMinutes': {
      const next = new Date(minute + MINUTE).getUTCMinutes();
      const step = Math.ceil(next / trigger.minutes) * trigger.minutes;

      return step >= 60 ? hour + HOUR : hour + step * MINUTE;
    }
    case 'everyHours': {
      const next = new Date(hour + HOUR).getUTCHours();
      const step = Math.ceil(next / trigger.hours) * trigger.hours;

      return step >= 24 ? day + DAY : day + step * HOUR;
    }
    case 'daily': {
      const today = day + trigger.hour * HOUR + trigger.minute * MINUTE;

      return today > wall ? today : today + DAY;
    }
    case 'weekly': {
      const ahead = (trigger.dayOfWeek - new Date(day).getUTCDay() + 7) % 7;
      const then = day + ahead * DAY + trigger.hour * HOUR + trigger.minute * MINUTE;

      return then > wall ? then : then + 7 * DAY;
    }
  }
};

/**
 * Says when a job next runs on its own, as the earliest of its triggers, reading each in the zone
 * the server keeps its schedules in.
 *
 * @param triggers - What makes the job run on its own.
 * @param zone - The IANA zone the server reads its schedules in.
 * @param now - The moment to count from.
 * @returns When it next runs, in milliseconds since the epoch, or null where nothing will run it.
 */
const nextRunOf = (triggers: ScheduleTrigger[], zone: string, now: Date): number | null => {
  const wall = now.getTime() + offsetAt(now, zone);

  const runs = triggers
    .map((trigger) => nextWallOf(trigger, wall))
    .filter((next) => next !== null)
    .map((next) => instantOf(next, zone).getTime());

  return runs.length === 0 ? null : Math.min(...runs);
};

export { nextRunOf };
