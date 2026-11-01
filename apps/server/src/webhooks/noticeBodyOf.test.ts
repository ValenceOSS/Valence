import { describe, expect, it } from 'vitest';
import { htmlMarkup } from './htmlMarkup';
import { noticeBodyOf } from './noticeBodyOf';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'The Long Night (2021)',
  lead: [{ strong: 'Dan' }, ' requested this film'],
  context: ['Seasons 1–3', 'By <The Band>'],
  body: 'A town & its sun.',
  tags: ['Waiting for approval', '★ 7.4'],
  details: [
    { label: 'Reason', text: 'Not <here>', look: 'quote' },
    { label: null, text: 'A.Release', look: 'code' },
  ],
  sections: [{ heading: 'Films · 2 added', lines: ['One & two', 'Three'] }],
  link: { label: 'How to fix it', url: 'https://docs.getvalence.app/a?b=1&c=2' },
  footer: 'Requests',
  tone: 'attention',
  isUrgent: false,
  posterUrl: null,
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
};

describe('noticeBodyOf', () => {
  it('writes the sentence, the small line, the summary, tags, details, lists and link in order', () => {
    expect(noticeBodyOf(aNotice, htmlMarkup)).toBe(
      [
        '<b>Dan</b> requested this film\nSeasons 1–3 · By &lt;The Band&gt;',
        'A town &amp; its sun.',
        '<code>Waiting for approval</code> | <code>★ 7.4</code>',
        '<b>Reason</b>\n<blockquote>Not &lt;here&gt;</blockquote>',
        '<code>A.Release</code>',
        '<b>Films · 2 added</b>\n• One &amp; two\n• Three',
        '<a href="https://docs.getvalence.app/a?b=1&amp;c=2">How to fix it</a>',
      ].join('\n\n'),
    );
  });

  it('sets a blank line between one list and the next', () => {
    expect(
      noticeBodyOf(
        {
          ...anEmptyNotice,
          sections: [
            { heading: 'Films', lines: ['One'] },
            { heading: 'Music', lines: ['Two'] },
          ],
        },
        htmlMarkup,
      ),
    ).toBe('<b>Films</b>\n• One\n\n<b>Music</b>\n• Two');
  });

  it('writes the small line alone where there is no sentence', () => {
    expect(noticeBodyOf({ ...anEmptyNotice, context: ['No action needed'] }, htmlMarkup)).toBe(
      'No action needed',
    );
  });

  it('says nothing for a notice with nothing beyond its title', () => {
    expect(noticeBodyOf(anEmptyNotice, htmlMarkup)).toBe('');
  });

  it('cuts a detail too long to read in a notification', () => {
    const body = noticeBodyOf(
      { ...anEmptyNotice, details: [{ label: null, text: 'x'.repeat(2000), look: 'quote' }] },
      htmlMarkup,
    );

    expect(body).toBe(`<blockquote>${'x'.repeat(499)}…</blockquote>`);
  });

  it('cuts the summary first, to stay inside the limit', () => {
    const body = noticeBodyOf(
      { ...aNotice, body: 'A long summary. '.repeat(40), link: null },
      htmlMarkup,
      400,
    );

    expect(body.length).toBeLessThanOrEqual(400);
    expect(body).toContain('A long summary.');
    expect(body).toContain('…');
    expect(body).toContain('<b>Films · 2 added</b>\n• One &amp; two\n• Three');
    expect(body).toContain('<blockquote>Not &lt;here&gt;</blockquote>');
  });

  it('measures the summary as it is sent, escapes and all', () => {
    const body = noticeBodyOf(
      { ...anEmptyNotice, lead: ['Hi'], body: '&'.repeat(100) },
      htmlMarkup,
      50,
    );

    expect(body.length).toBeLessThanOrEqual(50);
    expect(body).toMatch(/^Hi\n\n(&amp;)+…$/);
  });

  it('drops the summary before cutting a list, then cuts the list by whole lines', () => {
    const body = noticeBodyOf(
      {
        ...aNotice,
        link: null,
        sections: [
          { heading: 'Films', lines: Array.from({ length: 50 }, () => 'A long film title') },
        ],
      },
      htmlMarkup,
      500,
    );

    expect(body.length).toBeLessThanOrEqual(500);
    expect(body).not.toContain('A town');
    expect(body).toContain('<b>Films</b>\n• A long film title');
    expect(body.endsWith('• A long film title\n…')).toBe(true);
    expect(body).toContain('<code>Waiting for approval</code> | <code>★ 7.4</code>');
    expect(body).toContain('<code>A.Release</code>');
  });

  it('shortens every detail, halving it, before leaving any out', () => {
    const body = noticeBodyOf(
      {
        ...anEmptyNotice,
        details: Array.from({ length: 10 }, () => ({
          label: null,
          text: 'x'.repeat(600),
          look: 'quote' as const,
        })),
      },
      htmlMarkup,
      1024,
    );

    expect(body.split('\n\n')).toStrictEqual(
      Array.from({ length: 10 }, () => `<blockquote>${'x'.repeat(61)}…</blockquote>`),
    );
  });

  it('writes the small line in the receiver’s small print', () => {
    expect(
      noticeBodyOf(
        { ...anEmptyNotice, lead: ['Hi'], context: ['a', 'b'] },
        { ...htmlMarkup, small: (escaped) => `<small>${escaped}</small>` },
      ),
    ).toBe('Hi\n<small>a · b</small>');
  });

  it('falls back to the plain sentence and small line where even the details do not fit', () => {
    const body = noticeBodyOf(
      {
        ...aNotice,
        details: [{ label: null, text: '<'.repeat(400), look: 'quote' }],
      },
      htmlMarkup,
      100,
    );

    expect(body).toBe('Dan requested this film\nSeasons 1–3\nBy &lt;The Band&gt;');
  });

  it('cuts the plain sentence too, where nothing else fits', () => {
    const body = noticeBodyOf(
      { ...anEmptyNotice, lead: ['x'.repeat(200)], tags: ['y'.repeat(200)] },
      htmlMarkup,
      100,
    );

    expect(body).toBe(`${'x'.repeat(99)}…`);
  });
});
