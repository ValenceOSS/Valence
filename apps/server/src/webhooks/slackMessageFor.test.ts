import { describe, expect, it } from 'vitest';
import { slackMessageFor } from './slackMessageFor';
import type { WebhookNotice } from './webhookNoticeFor';

const aNotice: WebhookNotice = {
  title: 'Film request made: Dune (2021)',
  description: 'A mythic & emotionally charged <hero’s> journey.',
  tone: 'quiet',
  isUrgent: false,
  fields: [
    { name: 'Asked by', value: 'Ada', inline: true },
    { name: 'Status', value: 'Waiting for approval', inline: true },
  ],
  sections: [],
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
};

describe('slackMessageFor', () => {
  it('heads the message with the title and hangs the poster beside its summary', () => {
    const { blocks } = slackMessageFor(aNotice, 'Ada asked for the film Dune.');

    expect(blocks[0]).toStrictEqual({
      type: 'header',
      text: { type: 'plain_text', text: 'Film request made: Dune (2021)' },
    });
    expect(blocks[1]).toStrictEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'A mythic &amp; emotionally charged &lt;hero’s&gt; journey.',
      },
      accessory: {
        type: 'image',
        image_url: 'https://image.tmdb.org/t/p/w500/dune.jpg',
        alt_text: 'Film request made: Dune (2021)',
      },
    });
  });

  it('lays the details out as fields, each under its label in bold', () => {
    const { blocks } = slackMessageFor(aNotice, 'a sentence');

    expect(blocks[2]).toStrictEqual({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '*Asked by*\nAda' },
        { type: 'mrkdwn', text: '*Status*\nWaiting for approval' },
      ],
    });
  });

  it('sends the sentence too, for the notification and for receivers that ignore blocks', () => {
    expect(slackMessageFor(aNotice, 'Ada asked for <Dune>.').text).toBe(
      'Ada asked for &lt;Dune&gt;.',
    );
  });

  it('splits more than ten details across sections, which is all Slack puts in one', () => {
    const fields = Array.from({ length: 12 }, (_, index) => ({
      name: `Detail ${index.toString()}`,
      value: 'value',
      inline: true,
    }));
    const { blocks } = slackMessageFor({ ...aNotice, fields, posterUrl: null }, 'a sentence');

    expect(blocks.map((one) => ('fields' in one ? one.fields.length : 0))).toStrictEqual([
      0, 0, 10, 2,
    ]);
  });

  it('keeps every block inside Slack’s limits, which would otherwise refuse the message', () => {
    const { blocks } = slackMessageFor(
      {
        ...aNotice,
        title: 'T'.repeat(500),
        description: '&'.repeat(5000),
        fields: [{ name: 'Reason', value: 'x'.repeat(5000), inline: false }],
      },
      'a sentence',
    );

    expect(blocks[0] !== undefined && 'text' in blocks[0] && blocks[0].text.text.length).toBe(150);
    expect(
      blocks[1] !== undefined && 'text' in blocks[1] && blocks[1].text.text.length,
    ).toBeLessThanOrEqual(3000);
    expect(
      blocks[2] !== undefined && 'fields' in blocks[2] && blocks[2].fields[0]?.text.length,
    ).toBeLessThanOrEqual(2000);
  });

  it('writes each section under its heading', () => {
    const { blocks } = slackMessageFor(
      {
        ...aNotice,
        description: '',
        fields: [],
        posterUrl: null,
        sections: [{ heading: 'Films', body: 'Dune' }],
      },
      'a sentence',
    );

    expect(blocks[1]).toStrictEqual({
      type: 'section',
      text: { type: 'mrkdwn', text: '*Films*\nDune' },
    });
  });
});
