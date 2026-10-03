import { describe, expect, it } from 'vitest';
import { A_NEW_WEBHOOK } from './A_NEW_WEBHOOK';
import { webhookFormSchema } from './webhookFormSchema';

const FILLED = { ...A_NEW_WEBHOOK, name: ' Discord ', url: ' https://example.com/hook ' };

describe('webhookFormSchema', () => {
  it('reads a webhook, trimming what was typed', () => {
    expect(webhookFormSchema.parse(FILLED)).toMatchObject({
      name: 'Discord',
      url: 'https://example.com/hook',
      events: ['job.failed'],
    });
  });

  it('needs a name and a whole web address', () => {
    expect(webhookFormSchema.safeParse({ ...FILLED, name: '' }).error?.issues[0]?.path).toEqual([
      'name',
    ]);
    expect(
      webhookFormSchema.safeParse({ ...FILLED, url: 'example.com' }).error?.issues[0]?.path,
    ).toEqual(['url']);
  });

  it('needs at least one event to listen for', () => {
    expect(webhookFormSchema.safeParse({ ...FILLED, events: [] }).error?.issues[0]?.path).toEqual([
      'events',
    ]);
  });
});
