import { describe, expect, it } from 'vitest';
import { pushoverMessageFor } from './pushoverMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'The VPN is down',
  description: '',
  tone: 'failure',
  isUrgent: true,
  fields: [{ name: 'How to fix it', value: 'https://docs.getvalence.app/x', inline: false }],
  sections: [],
  posterUrl: null,
};

const WHEN = '2026-08-14T20:00:00.000Z';

describe('pushoverMessageFor', () => {
  it('sends the title and the details in Pushover’s HTML, stamped with when it happened', () => {
    expect(pushoverMessageFor(aNotice, {}, WHEN)).toStrictEqual({
      title: 'The VPN is down',
      message: '<b>How to fix it:</b> https://docs.getvalence.app/x',
      html: 1,
      priority: 1,
      timestamp: 1_786_737_600,
    });
  });

  it('passes the application token, user key, device and sound on from the address', () => {
    expect(
      pushoverMessageFor(aNotice, { token: 'a', user: 'u', device: 'phone', sound: 'none' }, WHEN),
    ).toMatchObject({ token: 'a', user: 'u', device: 'phone', sound: 'none' });
  });

  it('sends ordinary news at ordinary priority', () => {
    expect(pushoverMessageFor({ ...aNotice, isUrgent: false }, {}, WHEN).priority).toBe(0);
  });

  it('sends a notice with nothing beyond its title as the message, which Pushover needs', () => {
    const message = pushoverMessageFor({ ...aNotice, title: 'A & B', fields: [] }, {}, WHEN);

    expect(message.title).toBeUndefined();
    expect(message.message).toBe('A &amp; B');
  });

  it('stays inside the 1024 characters Pushover accepts', () => {
    const message = pushoverMessageFor({ ...aNotice, description: 'x'.repeat(5000) }, {}, WHEN);

    expect(message.message.length).toBeLessThanOrEqual(1024);
  });

  it('attaches the poster where Valence could fetch it', () => {
    expect(
      pushoverMessageFor(aNotice, {}, WHEN, { base64: 'AQID', type: 'image/jpeg' }),
    ).toMatchObject({ attachment_base64: 'AQID', attachment_type: 'image/jpeg' });
  });
});
