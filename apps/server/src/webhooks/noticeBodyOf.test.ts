import { describe, expect, it } from 'vitest';
import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import { noticeBodyOf } from './noticeBodyOf';
import type { NoticeMarkup } from './noticeBodyOf';
import type { WebhookNotice } from './webhookNoticeFor';

const html: NoticeMarkup = { escape: escapeHtml, bold: (escaped) => `<b>${escaped}</b>` };

const aNotice: WebhookNotice = {
  title: 'Film request made: Dune (2021)',
  description: 'A mythic & emotionally charged hero’s journey.',
  tone: 'quiet',
  isUrgent: false,
  fields: [
    { name: 'Asked by', value: 'Ada', inline: true },
    { name: 'Status', value: 'Waiting <for> approval', inline: true },
  ],
  sections: [],
  posterUrl: null,
};

describe('noticeBodyOf', () => {
  it('writes the summary, then each detail on a line of its own, in the receiver’s markup', () => {
    expect(noticeBodyOf(aNotice, html)).toBe(
      'A mythic &amp; emotionally charged hero’s journey.\n\n<b>Asked by:</b> Ada\n<b>Status:</b> Waiting &lt;for&gt; approval',
    );
  });

  it('writes each section under its heading', () => {
    expect(
      noticeBodyOf(
        {
          ...aNotice,
          description: '',
          fields: [],
          sections: [{ heading: 'Films', body: 'Dune\nArrival' }],
        },
        html,
      ),
    ).toBe('<b>Films</b>\nDune\nArrival');
  });

  it('says nothing for a notice with nothing beyond its title', () => {
    expect(noticeBodyOf({ ...aNotice, description: '', fields: [] }, html)).toBe('');
  });

  it('cuts the summary before any detail, to stay inside the limit', () => {
    const body = noticeBodyOf({ ...aNotice, description: 'x'.repeat(500) }, html, 120);

    expect(body.length).toBeLessThanOrEqual(120);
    expect(body).toContain('…');
    expect(body).toContain('<b>Status:</b> Waiting &lt;for&gt; approval');
  });

  it('measures the summary as it is sent, escapes and all', () => {
    const body = noticeBodyOf({ ...aNotice, description: '&'.repeat(100), fields: [] }, html, 50);

    expect(body.length).toBeLessThanOrEqual(50);
    expect(body).toMatch(/^(&amp;)+…$/);
  });

  it('cuts the value of a detail too long to fit, rather than leaving it out', () => {
    const body = noticeBodyOf(
      {
        ...aNotice,
        description: '',
        fields: [{ name: 'Reason', value: '<'.repeat(2000), inline: false }],
      },
      html,
      100,
    );

    expect(body.length).toBeLessThanOrEqual(100);
    expect(body).toMatch(/^<b>Reason:<\/b> (&lt;)+…$/);
  });

  it('keeps a label in bold on one line, so no cut can split it', () => {
    const body = noticeBodyOf(
      { ...aNotice, description: '', fields: [{ name: 'a\nb', value: 'c', inline: true }] },
      html,
    );

    expect(body).toBe('<b>a b:</b> c');
  });

  it('keeps every detail before the sections, and cuts the sections by whole lines', () => {
    const body = noticeBodyOf(
      {
        ...aNotice,
        description: 'A summary',
        sections: [
          {
            heading: 'Films',
            body: Array.from({ length: 50 }, () => 'A long film title').join('\n'),
          },
        ],
      },
      html,
      300,
    );

    expect(body.length).toBeLessThanOrEqual(300);
    expect(body.startsWith('<b>Films</b>\nA long film title')).toBe(true);
    expect(body).toContain('A long film title\n…\n\n<b>Asked by:</b> Ada');
    expect(body.endsWith('<b>Status:</b> Waiting &lt;for&gt; approval')).toBe(true);
  });
});
