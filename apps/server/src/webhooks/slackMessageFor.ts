import { clipText } from './clipText';
import { fitEscaped } from './fitEscaped';
import type { WebhookNotice } from './webhookNoticeFor';

const HEADER_LIMIT = 150;

const SECTION_TEXT_LIMIT = 3000;

const FIELD_TEXT_LIMIT = 2000;

const FIELDS_PER_SECTION = 10;

const ALT_TEXT_LIMIT = 2000;

const FALLBACK_LIMIT = 3000;

type SlackText = { type: 'plain_text' | 'mrkdwn'; text: string };

type SlackImage = { type: 'image'; image_url: string; alt_text: string };

type SlackSection =
  | { type: 'section'; text: SlackText; accessory?: SlackImage }
  | { type: 'section'; fields: SlackText[]; accessory?: SlackImage };

type SlackBlock = { type: 'header'; text: SlackText } | SlackSection;

type SlackMessage = {
  text: string;
  blocks: SlackBlock[];
};

/**
 * Escapes the three characters Slack's mrkdwn reads as markup, which is all Slack asks for.
 *
 * @param text - The text.
 * @returns The text, safe to put in mrkdwn.
 */
const escapeSlack = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Writes text as mrkdwn, cut to what Slack accepts.
 *
 * @param text - The text, unescaped.
 * @param limit - The most Slack takes.
 * @returns The mrkdwn.
 */
const mrkdwn = (text: string, limit: number): SlackText => ({
  type: 'mrkdwn',
  text: fitEscaped(text, limit, escapeSlack),
});

/**
 * Writes a bold label above some text as one piece of mrkdwn, cut to what Slack accepts.
 *
 * @param label - The label.
 * @param text - What sits beneath it.
 * @param limit - The most Slack takes for the whole piece.
 * @returns The mrkdwn.
 */
const labelled = (label: string, text: string, limit: number): SlackText => {
  const heading = `*${escapeSlack(label)}*\n`;

  return {
    type: 'mrkdwn',
    text: `${heading}${fitEscaped(text, limit - heading.length, escapeSlack)}`,
  };
};

/**
 * Writes one event as a Slack message from Block Kit, as Seerr does: the title as a header, its
 * summary beside the poster, then any sections and the labelled details as fields — each cut to
 * Slack's limits, since Slack refuses the whole message when one block is over. The plain sentence
 * goes alongside, for the notification and for any receiver that reads only Slack's `text`.
 *
 * @param notice - What to say.
 * @param sentence - The plain rendering, shown in the notification.
 * @returns The message.
 */
const slackMessageFor = (notice: WebhookNotice, sentence: string): SlackMessage => {
  const poster: SlackImage | null =
    notice.posterUrl === null
      ? null
      : {
          type: 'image',
          image_url: notice.posterUrl,
          alt_text: clipText(notice.title, ALT_TEXT_LIMIT),
        };

  const fieldSections = Array.from(
    { length: Math.ceil(notice.fields.length / FIELDS_PER_SECTION) },
    (_, index) =>
      notice.fields
        .slice(index * FIELDS_PER_SECTION, (index + 1) * FIELDS_PER_SECTION)
        .map((one) => labelled(one.name, one.value, FIELD_TEXT_LIMIT)),
  );

  const content: SlackSection[] = [
    ...(notice.description === ''
      ? []
      : [{ type: 'section' as const, text: mrkdwn(notice.description, SECTION_TEXT_LIMIT) }]),
    ...notice.sections.map((one) => ({
      type: 'section' as const,
      text: labelled(one.heading, one.body, SECTION_TEXT_LIMIT),
    })),
    ...fieldSections.map((fields) => ({ type: 'section' as const, fields })),
  ];

  const [first, ...rest] = content;

  return {
    text: mrkdwn(sentence, FALLBACK_LIMIT).text,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: clipText(notice.title, HEADER_LIMIT) },
      },
      ...(first === undefined || poster === null
        ? content
        : [{ ...first, accessory: poster }, ...rest]),
    ],
  };
};

export { slackMessageFor };

export type { SlackMessage };
