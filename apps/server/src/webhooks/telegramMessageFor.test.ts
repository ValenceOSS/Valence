import { describe, expect, it } from 'vitest';
import { telegramMessageFor } from './telegramMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Film request made: Tom & Jerry (1992)',
  description: 'A cat <chases> a mouse.',
  tone: 'quiet',
  isUrgent: false,
  fields: [{ name: 'Asked by', value: 'Ada', inline: true }],
  sections: [],
  posterUrl: null,
};

describe('telegramMessageFor', () => {
  it('writes the title in bold above the details, in Telegram’s HTML', () => {
    expect(telegramMessageFor(aNotice, {}).text).toBe(
      '<b>Film request made: Tom &amp; Jerry (1992)</b>\n\nA cat &lt;chases&gt; a mouse.\n\n<b>Asked by:</b> Ada',
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

  it('stays inside the 4096 characters Telegram accepts', () => {
    const message = telegramMessageFor({ ...aNotice, description: 'x'.repeat(10_000) }, {});

    expect(message.text.length).toBeLessThanOrEqual(4096);
    expect(message.text).toContain('<b>Asked by:</b> Ada');
  });
});
