import { z } from 'zod';
import type { ScheduleTrigger } from '@ValenceClient/admin/fetchAdmin';
import { readClock } from './readClock';
import { say } from '@ValenceI18n/say';

const MOST = { minutes: 59, hours: 23 } as const;

const AddTriggerFormSchema = z
  .object({
    type: z.enum(['daily', 'weekly', 'interval', 'startup']),
    time: z.string(),
    dayOfWeek: z.string(),
    every: z.string(),
    unit: z.enum(['minutes', 'hours']),
  })
  .superRefine((form, context) => {
    if (form.type === 'interval') {
      const count = Number(form.every);

      if (!Number.isInteger(count) || count < 1 || count > MOST[form.unit]) {
        context.addIssue({
          code: 'custom',
          path: ['every'],
          message: say('screens.adminArea.addTriggerDialog.aWholeNumberFrom1To', {
            most: MOST[form.unit].toString(),
          }),
        });
      }
    }

    if ((form.type === 'daily' || form.type === 'weekly') && readClock(form.time) === null) {
      context.addIssue({
        code: 'custom',
        path: ['time'],
        message: say('screens.adminArea.addTriggerDialog.aTimeOfDay'),
      });
    }
  })
  .transform((form): ScheduleTrigger => {
    const clock = readClock(form.time) ?? { hour: 3, minute: 0 };

    if (form.type === 'startup') {
      return { kind: 'startup' };
    }

    if (form.type === 'interval') {
      return form.unit === 'minutes'
        ? { kind: 'everyMinutes', minutes: Number(form.every) }
        : { kind: 'everyHours', hours: Number(form.every) };
    }

    return form.type === 'daily'
      ? { kind: 'daily', hour: clock.hour, minute: clock.minute }
      : { kind: 'weekly', dayOfWeek: Number(form.dayOfWeek), ...clock };
  });

export { AddTriggerFormSchema };
