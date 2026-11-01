import { describe, expect, it } from 'vitest';
import { telegramMessageFor } from './telegramMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Tom & Jerry (1992)',
  lead: [{ strong: 'Dan' }, ' requested this film'],
  context: [],
  body: 'A cat <chases> a mouse.',
  tags: ['Waiting for approval'],
  details: [],
  sections: [],
  link: null,
  footer: 'Requests',
  tone: 'attention',
  isUrgent: false,
  posterUrl: null,
};

describe('telegramMessageFor', () => {
  it('writes the title in bold above the body, in Telegram’s HTML', () => {
    expect(telegramMessageFor(aNotice, {}).text).toBe(
      '<b>Tom &amp; Jerry (1992)</b>\n\n<b>Dan</b> requested this film\n\nA cat &lt;chases&gt; a mouse.\n\n<code>Waiting for approval</code>',
    );
  });

  it('quotes a detail and links to how to fix it', () => {
    expect(
      telegramMessageFor(
        {
          ...aNotice,
          title: 'Download VPN is down',
          lead: [],
          body: '',
          tags: [],
          details: [{ label: null, text: 'the tunnel closed', look: 'quote' }],
          link: { label: 'How to fix it', url: 'https://docs.getvalence.app/requests#vpn' },
        },
        {},
      ).text,
    ).toBe(
      '<b>Download VPN is down</b>\n\n<blockquote>the tunnel closed</blockquote>\n\n<a href="https://docs.getvalence.app/requests#vpn">How to fix it</a>',
    );
  });

  it('sends the title alone where there is nothing more to say', () => {
    expect(telegramMessageFor({ ...aNotice, lead: [], body: '', tags: [] }, {}).text).toBe(
      '<b>Tom &amp; Jerry (1992)</b>',
    );
  });

  it('passes the chat and topic on from the address', () => {
    const message = telegramMessageFor(aNotice, {
      chat_id: '-100123',
      message_thread_id: '7',
    });

    expect(message.chat_id).toBe('-100123');
    expect(message.message_thread_id).toBe('7');
    expect(message.parse_mode).toBe('HTML');
  });

  it('turns link previews off where there is no poster to show', () => {
    expect(telegramMessageFor(aNotice, {}).link_preview_options).toStrictEqual({
      is_disabled: true,
    });
  });

  it('shows the poster as the preview, through a link with nothing to read in it', () => {
    const message = telegramMessageFor(
      { ...aNotice, posterUrl: 'https://image.tmdb.org/t/p/w500/a.jpg?x=1&y=2' },
      {},
    );

    expect(
      message.text.startsWith(
        '<a href="https://image.tmdb.org/t/p/w500/a.jpg?x=1&amp;y=2">​</a><b>',
      ),
    ).toBe(true);
    expect(message.link_preview_options).toStrictEqual({
      url: 'https://image.tmdb.org/t/p/w500/a.jpg?x=1&y=2',
      prefer_large_media: true,
    });
  });

  it('stays inside the 4096 characters Telegram accepts, keeping the sentence and tags', () => {
    const message = telegramMessageFor(
      { ...aNotice, title: '&'.repeat(1000), body: 'x'.repeat(10_000) },
      {},
    );

    expect(message.text.length).toBeLessThanOrEqual(4096);
    expect(message.text).toContain('<b>Dan</b> requested this film');
    expect(message.text).toContain('<code>Waiting for approval</code>');
  });
});
