import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { AddTriggerFormSchema } from './AddTriggerFormSchema';

const FORM: z.input<typeof AddTriggerFormSchema> = {
  type: 'daily',
  time: '02:30',
  dayOfWeek: '1',
  every: '15',
  unit: 'minutes',
};

describe('AddTriggerFormSchema', () => {
  it('reads each kind of trigger into what the server takes', () => {
    expect(AddTriggerFormSchema.parse(FORM)).toEqual({ kind: 'daily', hour: 2, minute: 30 });
    expect(AddTriggerFormSchema.parse({ ...FORM, type: 'weekly' })).toEqual({
      kind: 'weekly',
      dayOfWeek: 1,
      hour: 2,
      minute: 30,
    });
    expect(AddTriggerFormSchema.parse({ ...FORM, type: 'interval' })).toEqual({
      kind: 'everyMinutes',
      minutes: 15,
    });
    expect(
      AddTriggerFormSchema.parse({ ...FORM, type: 'interval', unit: 'hours', every: '6' }),
    ).toEqual({
      kind: 'everyHours',
      hours: 6,
    });
    expect(AddTriggerFormSchema.parse({ ...FORM, type: 'startup', time: '' })).toEqual({
      kind: 'startup',
    });
  });

  it('refuses an interval cron could not express, saying how far it goes', () => {
    const parsed = AddTriggerFormSchema.safeParse({ ...FORM, type: 'interval', every: '90' });

    expect(parsed.error?.issues[0]?.path).toEqual(['every']);
    expect(parsed.error?.issues[0]?.message).toContain('59');
  });

  it('refuses a time of day that is not one', () => {
    expect(AddTriggerFormSchema.safeParse({ ...FORM, time: '' }).error?.issues[0]?.path).toEqual([
      'time',
    ]);
  });
});
