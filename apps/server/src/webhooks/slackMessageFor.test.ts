import { describe, expect, it } from 'vitest';
import { slackMessageFor } from './slackMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const POSTER = 'https://image.tmdb.org/t/p/w500/poster.jpg';

const aNotice: WebhookNotice = {
  title: 'The Long Night (2021)',
  lead: [{ strong: 'Dan & Co' }, ' requested this film'],
  context: ['Seasons 1–3', 'By <The Band>'],
  body: 'A town & its <sun>.',
  tags: ['Waiting for approval', '★ 7.4'],
  details: [
    { label: 'Reason', text: 'Not <here>\nor there', look: 'quote' },
    { label: 'Release', text: 'A`Release', look: 'code' },
  ],
  sections: [{ heading: 'Films', lines: ['One & two', 'Three'] }],
  link: { label: 'How to fix it', url: 'https://docs.getvalence.app/requests' },
  footer: 'Requests',
  tone: 'attention',
  isUrgent: false,
  posterUrl: POSTER,
};

const anEmptyNotice: WebhookNotice = {
  ...aNotice,
  lead: [],
  context: [],
  body: '',
  tags: [],
  details: [],
  sections: [],
  link: null,
  footer: null,
  posterUrl: null,
};

const section = (text: string) => ({ type: 'section', text: { type: 'mrkdwn', text } });

const context = (text: string) => ({ type: 'context', elements: [{ type: 'mrkdwn', text }] });

describe('slackMessageFor', () => {
  it('heads the message with the title, the sentence beside the poster, then the rest', () => {
    expect(slackMessageFor(aNotice, 'Dan requested a film.').blocks).toStrictEqual([
      { type: 'header', text: { type: 'plain_text', text: 'The Long Night (2021)' } },
      {
        ...section('*Dan &amp; Co* requested this film'),
        accessory: { type: 'image', image_url: POSTER, alt_text: 'The Long Night (2021)' },
      },
      context('Seasons 1–3 · By &lt;The Band&gt;'),
      section('A town &amp; its &lt;sun&gt;.'),
      section('`Waiting for approval` | `★ 7.4`'),
      section('*Reason*\n>Not &lt;here&gt;\n>or there'),
      section('*Release*\n`AˋRelease`'),
      section('*Films*\n• One &amp; two\n• Three'),
      section('<https://docs.getvalence.app/requests|How to fix it>'),
      context('Requests'),
    ]);
  });

  it('sets the small line straight under the header where there is no sentence', () => {
    expect(
      slackMessageFor(
        { ...anEmptyNotice, context: ['No action needed'], body: 'A summary', posterUrl: POSTER },
        'a sentence',
      ).blocks,
    ).toStrictEqual([
      { type: 'header', text: { type: 'plain_text', text: 'The Long Night (2021)' } },
      context('No action needed'),
      {
        ...section('A summary'),
        accessory: { type: 'image', image_url: POSTER, alt_text: 'The Long Night (2021)' },
      },
    ]);
  });

  it('sends only the header for a notice with nothing beyond its title', () => {
    expect(slackMessageFor(anEmptyNotice, 'a sentence').blocks).toStrictEqual([
      { type: 'header', text: { type: 'plain_text', text: 'The Long Night (2021)' } },
    ]);
  });

  it('sends the sentence too, for the notification and for receivers that ignore blocks', () => {
    expect(slackMessageFor(aNotice, 'Dan asked for <a film>.').text).toBe(
      'Dan asked for &lt;a film&gt;.',
    );
  });

  it('keeps every block inside Slack’s limits, which would otherwise refuse the message', () => {
    const { text, blocks } = slackMessageFor(
      {
        ...aNotice,
        title: 'T'.repeat(500),
        lead: ['x'.repeat(5000)],
        context: ['c'.repeat(5000)],
        body: '&'.repeat(5000),
      },
      '<'.repeat(5000),
    );
    const lengths = blocks.map((one) =>
      one.type === 'context' ? (one.elements[0]?.text.length ?? 0) : one.text.text.length,
    );

    expect(text.length).toBeLessThanOrEqual(3000);
    expect(lengths.slice(0, 3)).toStrictEqual([150, 3000, 2000]);
    expect(lengths[3]).toBeLessThanOrEqual(3000);
  });

  it('keeps to Slack’s fifty blocks however many lists there are, saying where it stopped', () => {
    const { blocks } = slackMessageFor(
      {
        ...aNotice,
        sections: Array.from({ length: 80 }, (_, index) => ({
          heading: `Library ${index.toString()}`,
          lines: ['A film'],
        })),
      },
      'Scanned 80 libraries',
    );

    expect(blocks).toHaveLength(50);
    expect(blocks.at(-1)).toStrictEqual(context('Requests'));
    expect(blocks.at(-2)).toStrictEqual(
      section('<https://docs.getvalence.app/requests|How to fix it>'),
    );
    expect(blocks.at(-3)).toStrictEqual(section('…'));
  });

  it('cuts a long summary before escaping it, so it never ends inside an escape', () => {
    const { blocks } = slackMessageFor(
      {
        title: 'Ampersands',
        lead: [],
        context: [],
        body: '&'.repeat(5000),
        tags: [],
        details: [],
        sections: [],
        link: null,
        footer: null,
        tone: 'quiet',
        isUrgent: false,
        posterUrl: null,
      },
      'Ampersands',
    );
    const body = blocks.flatMap((one) => (one.type === 'section' ? [one.text.text] : []))[0];

    expect(body?.length).toBeLessThanOrEqual(3000);
    expect(body).toMatch(/(&amp;)+…$/u);
  });

  it('escapes tags and code, so a value cannot ping a channel or hide a link', () => {
    const { blocks } = slackMessageFor(
      {
        ...anEmptyNotice,
        tags: ['note: <!channel> <https://evil.example|click> & more'],
        details: [{ label: null, text: '<!here>', look: 'code' }],
      },
      'a sentence',
    );

    expect(blocks.slice(1)).toStrictEqual([
      section('`note: &lt;!channel&gt; &lt;https://evil.example|click&gt; &amp; more`'),
      section('`&lt;!here&gt;`'),
    ]);
  });

  it('fits a long list by whole lines, ending it with an ellipsis where it was cut', () => {
    const { blocks } = slackMessageFor(
      {
        ...anEmptyNotice,
        sections: [{ heading: 'Films', lines: Array.from({ length: 1000 }, () => 'A & B') }],
      },
      'a sentence',
    );
    const list = blocks[1]?.type === 'section' ? blocks[1].text.text : '';

    expect(list.length).toBeLessThanOrEqual(3000);
    expect(list.startsWith('*Films*\n• A &amp; B\n')).toBe(true);
    expect(list.endsWith('\n• A &amp; B\n…')).toBe(true);
  });
});
