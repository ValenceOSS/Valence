import { describe, expect, it } from 'vitest';
import { gotifyMessageFor } from './gotifyMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'The Long Night (2021)',
  lead: ['Added to ', { strong: 'Films' }],
  context: ['Drama', 'Mystery'],
  body: '',
  tags: ['Film', '★ 7.4'],
  details: [],
  sections: [],
  link: null,
  footer: 'Films',
  tone: 'arrival',
  isUrgent: false,
  posterUrl: null,
};

describe('gotifyMessageFor', () => {
  it('sends the title, and the body as Markdown', () => {
    expect(gotifyMessageFor(aNotice)).toStrictEqual({
      title: 'The Long Night (2021)',
      message: 'Added to **Films**\nDrama · Mystery\n\n`Film` | `★ 7.4`',
      priority: 5,
      extras: { 'client::display': { contentType: 'text/markdown' } },
    });
  });

  it('raises a problem somebody has to put right to a priority that breaks through', () => {
    expect(gotifyMessageFor({ ...aNotice, tone: 'failure', isUrgent: true }).priority).toBe(8);
  });

  it('shows the poster beneath the body and as the notification’s picture', () => {
    const message = gotifyMessageFor({
      ...aNotice,
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster (1).jpg',
    });

    expect(
      message.message.endsWith('\n\n![](https://image.tmdb.org/t/p/w500/poster%20%281%29.jpg)'),
    ).toBe(true);
    expect(message.extras['client::notification']).toStrictEqual({
      bigImageUrl: 'https://image.tmdb.org/t/p/w500/poster (1).jpg',
    });
  });

  it('sends a notice with nothing beyond its title as the message alone', () => {
    const message = gotifyMessageFor({
      ...aNotice,
      title: 'Job *failed*',
      lead: [],
      context: [],
      tags: [],
    });

    expect(message.title).toBeUndefined();
    expect(message.message).toBe('Job \\*failed\\*');
  });
});
