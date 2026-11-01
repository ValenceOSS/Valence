import { clipText } from './clipText';
import { fitEscaped } from './fitEscaped';
import type { NoticeDetail, NoticeSection, NoticeWords, WebhookNotice } from './webhookNoticeFor';

const HEADER_LIMIT = 150;

const SECTION_TEXT_LIMIT = 3000;

const CONTEXT_TEXT_LIMIT = 2000;

const ALT_TEXT_LIMIT = 2000;

const FALLBACK_LIMIT = 3000;

const DETAIL_LIMIT = 500;

const LIST_LINE_LIMIT = 200;

type SlackText = { type: 'plain_text' | 'mrkdwn'; text: string };

type SlackImage = { type: 'image'; image_url: string; alt_text: string };

type SlackSection = { type: 'section'; text: SlackText; accessory?: SlackImage };

type SlackContext = { type: 'context'; elements: SlackText[] };

type SlackBlock = { type: 'header'; text: SlackText } | SlackSection | SlackContext;

type SlackMessage = {
  text: string;
  blocks: SlackBlock[];
};

/**
 * Text from elsewhere, kept from being read as Slack's markup.
 *
 * @param text - The text.
 * @returns It, escaped.
 */
const escapeSlack = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * A block of Slack's markup, cut to fit.
 *
 * @param text - The markup, already escaped.
 * @param limit - The most characters Slack takes.
 * @returns The text.
 */
const mrkdwn = (text: string, limit: number): SlackText => ({
  type: 'mrkdwn',
  text: clipText(text, limit),
});

/**
 * A notice's sentence with the names it is about in bold.
 *
 * @param words - The sentence, in parts.
 * @returns The sentence.
 */
const sentenceOf = (words: NoticeWords): string =>
  words
    .map((part) => (typeof part === 'string' ? escapeSlack(part) : `*${escapeSlack(part.strong)}*`))
    .join('');

/**
 * A detail under its label, quoted or set as code.
 *
 * @param detail - The detail.
 * @returns How it is written.
 */
const detailOf = (detail: NoticeDetail): string => {
  const text = clipText(detail.text, DETAIL_LIMIT);
  const written =
    detail.look === 'code'
      ? `\`${escapeSlack(text.replaceAll('`', 'ˋ'))}\``
      : text
          .split('\n')
          .map((line) => `>${escapeSlack(line)}`)
          .join('\n');

  return detail.label === null ? written : `*${escapeSlack(detail.label)}*\n${written}`;
};

/**
 * One of a notice's lists under its heading, with as many of its lines as fit and an ellipsis where
 * the rest do not, cut between lines so an escape is never split.
 *
 * @param section - The list.
 * @returns How it is written.
 */
const listOf = (section: NoticeSection): string => {
  const heading = `*${escapeSlack(section.heading)}*`;
  const kept: string[] = [];
  let used = heading.length;

  for (const line of section.lines) {
    const written = `• ${escapeSlack(clipText(line, LIST_LINE_LIMIT))}`;

    if (used + 1 + written.length + 2 > SECTION_TEXT_LIMIT) {
      return [heading, ...kept, '…'].join('\n');
    }

    kept.push(written);
    used += 1 + written.length;
  }

  return [heading, ...kept].join('\n');
};

/**
 * A small line of Slack's context, or nothing where there is nothing on it.
 *
 * @param parts - What goes on the line.
 * @returns The block, or nothing.
 */
const contextOf = (parts: string[]): SlackContext[] =>
  parts.length === 0
    ? []
    : [
        {
          type: 'context',
          elements: [mrkdwn(escapeSlack(parts.join(' · ')), CONTEXT_TEXT_LIMIT)],
        },
      ];

/**
 * Draws an event as Slack blocks, with the plain sentence beside them for notifications.
 *
 * @param notice - What to say.
 * @param sentence - The event in one plain sentence.
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
  const lead = sentenceOf(notice.lead);
  const sections: SlackSection[] = [
    lead,
    fitEscaped(notice.body, SECTION_TEXT_LIMIT, escapeSlack),
    notice.tags.map((one) => `\`${escapeSlack(one.replaceAll('`', 'ˋ'))}\``).join(' | '),
    ...notice.details.map(detailOf),
    ...notice.sections.map(listOf),
    notice.link === null ? '' : `<${notice.link.url}|${escapeSlack(notice.link.label)}>`,
  ]
    .filter((one) => one !== '')
    .map((text) => ({ type: 'section' as const, text: mrkdwn(text, SECTION_TEXT_LIMIT) }));
  const [first, ...rest] = sections;
  const withPoster =
    first === undefined || poster === null ? sections : [{ ...first, accessory: poster }, ...rest];
  const [leading, ...following] = withPoster;
  const isLeadFirst = lead !== '' && leading !== undefined;

  return {
    text: fitEscaped(sentence, FALLBACK_LIMIT, escapeSlack),
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: clipText(notice.title, HEADER_LIMIT) },
      },
      ...(isLeadFirst
        ? [leading, ...contextOf(notice.context), ...following]
        : [...contextOf(notice.context), ...withPoster]),
      ...contextOf(notice.footer === null ? [] : [notice.footer]),
    ],
  };
};

export { slackMessageFor };

export type { SlackMessage };
