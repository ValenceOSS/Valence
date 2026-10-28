import { describe, expect, it } from 'vitest';
import { gotifyMessageFor } from './gotifyMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Dune (2021)',
  description: 'Added to Films',
  tone: 'arrival',
  isUrgent: false,
  fields: [{ name: 'Library', value: 'Films', inline: true }],
  sections: [],
  posterUrl: null,
};

describe('gotifyMessageFor', () => {
  it('sends the title, and the details as Markdown', () => {
    expect(gotifyMessageFor(aNotice)).toStrictEqual({
      title: 'Dune (2021)',
      message: 'Added to Films\n\n**Library:** Films',
      priority: 5,
      extras: { 'client::display': { contentType: 'text/markdown' } },
    });
  });

  it('raises a problem somebody has to put right to a priority that breaks through', () => {
    expect(gotifyMessageFor({ ...aNotice, tone: 'failure', isUrgent: true }).priority).toBe(8);
  });

  it('shows the poster beneath the details and as the notification’s picture', () => {
    const message = gotifyMessageFor({
      ...aNotice,
      posterUrl: 'https://image.tmdb.org/t/p/w500/dune (1).jpg',
    });

    expect(
      message.message.endsWith('![](https://image.tmdb.org/t/p/w500/dune%20%281%29.jpg)'),
    ).toBe(true);
    expect(message.extras['client::notification']).toStrictEqual({
      bigImageUrl: 'https://image.tmdb.org/t/p/w500/dune (1).jpg',
    });
  });

  it('sends a notice with nothing beyond its title as the message alone', () => {
    const message = gotifyMessageFor({
      ...aNotice,
      title: 'The catalogue can be reached again.',
      description: '',
      fields: [],
    });

    expect(message.title).toBeUndefined();
    expect(message.message).toBe('The catalogue can be reached again.');
  });
});
