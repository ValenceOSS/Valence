import { instantOf } from '@ValenceClient/admin/instantOf';
import type { ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';

type DescribeTriggerInZoneOptions = {
  trigger: ScheduleTrigger;
  serverZone: string;
  viewerZone: string;
  now: Date;
};

/**
 * Says when a clock trigger falls on the reader's own clock, where that differs from the server's.
 *
 * The day matters as much as the hour, which is the whole reason this exists: a weekly job an
 * operator set for Sunday morning in London falls on **Saturday** through much of the United States,
 * and a label that showed only the time would hide the part that surprises somebody.
 *
 * @param options - The trigger, both zones, and the moment to read them at.
 * @returns The reader's own time, or null when there is nothing useful to add.
 */
const describeTriggerInZone = ({
  trigger,
  serverZone,
  viewerZone,
  now,
}: DescribeTriggerInZoneOptions): string | null => {
  if (serverZone === viewerZone || serverZone.length === 0 || viewerZone.length === 0) {
    return null;
  }

  if (trigger.kind !== 'daily' && trigger.kind !== 'weekly') {
    return null;
  }

  const here = new Intl.DateTimeFormat('en-CA', {
    timeZone: serverZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const read = (type: string): number => Number(here.find((part) => part.type === type)?.value);

  const dayShift =
    trigger.kind === 'weekly'
      ? (trigger.dayOfWeek -
          new Date(Date.UTC(read('year'), read('month') - 1, read('day'))).getUTCDay() +
          7) %
        7
      : 0;

  const wall = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day') + dayShift,
    trigger.hour,
    trigger.minute,
  );

  const instant = instantOf(wall, serverZone);

  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: viewerZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instant);

  if (trigger.kind === 'daily') {
    return `${clock} your time`;
  }

  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: viewerZone,
    weekday: 'long',
  }).format(instant);

  return `${day} at ${clock} your time`;
};

export type { DescribeTriggerInZoneOptions };

export { describeTriggerInZone };
