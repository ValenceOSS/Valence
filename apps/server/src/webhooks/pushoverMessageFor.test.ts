import { describe, expect, it } from 'vitest';
import { pushoverMessageFor } from './pushoverMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Download VPN is down',
  lead: [],
  context: [],
  body: '',
  tags: [],
  details: [{ label: null, text: 'the tunnel closed', look: 'quote' }],
  sections: [],
  link: { label: 'How to fix it', url: 'https://docs.getvalence.app/x' },
  footer: 'Requests',
  tone: 'failure',
  isUrgent: true,
  posterUrl: null,
};

const WHEN = '2026-08-14T20:00:00.000Z';

describe('pushoverMessageFor', () => {
  it('sends the title and the body in Pushover’s HTML, stamped with when it happened', () => {
    expect(pushoverMessageFor(aNotice, {}, WHEN)).toStrictEqual({
      title: 'Download VPN is down',
      message:
        '<i>the tunnel closed</i>\n\n<a href="https://docs.getvalence.app/x">How to fix it</a>',
      html: 1,
      priority: 1,
      timestamp: 1_786_737_600,
    });
  });

  it('writes tags and code as plain text, which is all Pushover’s HTML has for them', () => {
    expect(
      pushoverMessageFor(
        {
          ...aNotice,
          tags: ['3 attempts'],
          details: [{ label: 'Release', text: 'A.Release', look: 'code' }],
          link: null,
        },
        {},
        WHEN,
      ).message,
    ).toBe('3 attempts\n\n<b>Release</b>\nA.Release');
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
    const message = pushoverMessageFor(
      { ...aNotice, title: 'A & B', details: [], link: null },
      {},
      WHEN,
    );

    expect(message.title).toBeUndefined();
    expect(message.message).toBe('A &amp; B');
  });

  it('cuts a title too long for Pushover', () => {
    expect(pushoverMessageFor({ ...aNotice, title: 'T'.repeat(400) }, {}, WHEN).title).toHaveLength(
      250,
    );
  });

  it('stays inside the 1024 characters Pushover accepts, keeping the sentence, tags and details', () => {
    const message = pushoverMessageFor(
      {
        ...aNotice,
        lead: [{ strong: 'Dan' }, ' requested this film'],
        body: 'x'.repeat(5000),
        tags: ['Waiting for approval'],
      },
      {},
      WHEN,
    );

    expect(message.message.length).toBeLessThanOrEqual(1024);
    expect(message.message).toContain('<b>Dan</b> requested this film');
    expect(message.message).toContain('Waiting for approval');
    expect(message.message).toContain('<i>the tunnel closed</i>');
    expect(message.message).toContain('How to fix it</a>');
  });

  it('keeps all of ten long details, each shortened, inside the limit', () => {
    const message = pushoverMessageFor(
      {
        ...aNotice,
        link: null,
        details: Array.from({ length: 10 }, (_, index) => ({
          label: null,
          text: `${index.toString()}${'x'.repeat(600)}`,
          look: 'quote' as const,
        })),
      },
      {},
      WHEN,
    );

    expect(message.message.length).toBeLessThanOrEqual(1024);
    expect(message.message.match(/<i>\d+x+…<\/i>/g)).toHaveLength(10);
  });

  it('drops the summary before cutting a list, and cuts the list by whole lines', () => {
    const message = pushoverMessageFor(
      {
        ...aNotice,
        body: 'A summary',
        sections: [{ heading: 'Films', lines: Array.from({ length: 100 }, () => 'A film title') }],
      },
      {},
      WHEN,
    );

    expect(message.message.length).toBeLessThanOrEqual(1024);
    expect(message.message).not.toContain('A summary');
    expect(message.message).toContain('<b>Films</b>\n• A film title');
    expect(message.message).toContain('• A film title\n…');
  });

  it('attaches the poster where Valence could fetch it', () => {
    expect(
      pushoverMessageFor(aNotice, {}, WHEN, { base64: 'AQID', type: 'image/jpeg' }),
    ).toMatchObject({ attachment_base64: 'AQID', attachment_type: 'image/jpeg' });
  });
});
