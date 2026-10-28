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

  it('names what a service needs that its address leaves out', () => {
    const checked = webhookFormSchema.safeParse({
      ...FILLED,
      preset: 'pushover',
      url: 'https://api.pushover.net/1/messages.json?token=abc',
    });

    expect(checked.error?.issues[0]?.path).toEqual(['url']);
    expect(checked.error?.issues[0]?.message).toBe('The address is missing user.');
  });

  it('takes a service’s address once it carries what the service needs', () => {
    expect(
      webhookFormSchema.safeParse({
        ...FILLED,
        preset: 'telegram',
        url: 'https://api.telegram.org/bot1:abc/sendMessage?chat_id=-100123',
      }).success,
    ).toBe(true);
  });
});
