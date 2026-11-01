import { clipText } from './clipText';
import { fitEscaped } from './fitEscaped';
import type { NoticeDetail, NoticeSection, NoticeWords, WebhookNotice } from './webhookNoticeFor';

type NoticeMarkup = {
  escape: (text: string) => string;
  bold: (escaped: string) => string;
  code: (text: string) => string;
  quote: (escaped: string) => string;
  link: (escapedLabel: string, url: string) => string;
  bullet: (escaped: string) => string;
  small: (escaped: string) => string;
};

const PARAGRAPH_BREAK = '\n\n';

const CUT_SHORT = '…';

const DETAIL_LIMIT = 500;

const SHORTEST_DETAIL = 20;

/**
 * A notice's sentence with the names it is about in bold.
 *
 * @param words - The sentence, in parts.
 * @param markup - How the receiver writes bold and escapes text.
 * @returns The sentence.
 */
const sentenceOf = (words: NoticeWords, markup: NoticeMarkup): string =>
  words
    .map((part) =>
      typeof part === 'string' ? markup.escape(part) : markup.bold(markup.escape(part.strong)),
    )
    .join('');

/**
 * A detail under its label, quoted or set as code.
 *
 * @param detail - The detail.
 * @param markup - How the receiver writes it.
 * @param room - The most characters of the detail's own text to keep.
 * @returns How it is written.
 */
const detailOf = (detail: NoticeDetail, markup: NoticeMarkup, room: number): string => {
  const text = clipText(detail.text, room);
  const written = detail.look === 'code' ? markup.code(text) : markup.quote(markup.escape(text));

  return detail.label === null
    ? written
    : `${markup.bold(markup.escape(detail.label))}\n${written}`;
};

/**
 * As many of a notice's lists as fit, cut short with an ellipsis where the rest does not.
 *
 * @param sections - The lists.
 * @param markup - How the receiver writes them.
 * @param room - How many characters are left.
 * @returns The lists, as they fit.
 */
const fitSections = (sections: NoticeSection[], markup: NoticeMarkup, room: number): string => {
  const lines = sections.flatMap((one, index) => [
    ...(index === 0 ? [] : ['']),
    markup.bold(markup.escape(one.heading)),
    ...one.lines.map((line) => markup.bullet(markup.escape(line))),
  ]);
  const kept: string[] = [];
  let used = 0;

  for (const line of lines) {
    const gap = kept.length === 0 ? 0 : 1;

    if (used + gap + line.length + 1 + CUT_SHORT.length > room) {
      return kept.length === 0 ? '' : [...kept, CUT_SHORT].join('\n');
    }

    kept.push(line);
    used += gap + line.length;
  }

  return kept.join('\n');
};

/**
 * Writes a notice's body as one block of text for Telegram, Gotify, Pushover or Apprise, keeping
 * the sentence, the details and the link whole within the receiver's limit.
 *
 * @param notice - What to say.
 * @param markup - How the receiver writes it.
 * @param limit - The most characters the receiver takes.
 * @returns The body, or nothing where the notice has nothing beyond its title.
 */
const noticeBodyOf = (
  notice: WebhookNotice,
  markup: NoticeMarkup,
  limit: number = Number.POSITIVE_INFINITY,
): string => {
  const head = [
    sentenceOf(notice.lead, markup),
    notice.context.length === 0 ? '' : markup.small(markup.escape(notice.context.join(' · '))),
  ]
    .filter((one) => one !== '')
    .join('\n');
  const tags = notice.tags.map(markup.code).join(' | ');
  const link =
    notice.link === null ? '' : markup.link(markup.escape(notice.link.label), notice.link.url);
  const fixedAt = (room: number) => {
    const written = notice.details.map((one) => detailOf(one, markup, room));

    return {
      details: written,
      length: [head, tags, ...written, link].filter((one) => one !== '').join(PARAGRAPH_BREAK)
        .length,
    };
  };
  let detailRoom = DETAIL_LIMIT;
  let { details, length: fixedLength } = fixedAt(detailRoom);

  while (fixedLength > limit && detailRoom > SHORTEST_DETAIL) {
    detailRoom = Math.floor(detailRoom / 2);
    ({ details, length: fixedLength } = fixedAt(detailRoom));
  }

  if (fixedLength > limit) {
    return fitEscaped(
      [
        notice.lead.map((part) => (typeof part === 'string' ? part : part.strong)).join(''),
        ...notice.context,
      ]
        .filter((one) => one !== '')
        .join('\n'),
      limit,
      markup.escape,
    );
  }

  const roomForSections = limit - fixedLength - PARAGRAPH_BREAK.length;
  const sections = fitSections(notice.sections, markup, roomForSections);
  const isEverySectionWhole =
    sections === fitSections(notice.sections, markup, Number.POSITIVE_INFINITY);
  const roomForBody =
    roomForSections - (sections === '' ? 0 : sections.length + PARAGRAPH_BREAK.length);
  const body =
    notice.body === '' || !isEverySectionWhole || roomForBody <= CUT_SHORT.length
      ? ''
      : fitEscaped(notice.body, roomForBody, markup.escape);

  return [head, body, tags, ...details, sections, link]
    .filter((one) => one !== '')
    .join(PARAGRAPH_BREAK);
};

export { noticeBodyOf };

export type { NoticeMarkup };
