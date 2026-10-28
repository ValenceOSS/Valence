import { fitEscaped } from './fitEscaped';
import type { NoticeField, NoticeSection, WebhookNotice } from './webhookNoticeFor';

type NoticeMarkup = {
  escape: (text: string) => string;
  bold: (escaped: string) => string;
};

const PARAGRAPH_BREAK = '\n\n';

const CUT_SHORT = '…';

/**
 * Writes a label in bold on one line, since a cut made between lines must never fall inside markup.
 *
 * @param label - The label.
 * @param markup - How the receiver escapes text and marks it bold.
 * @returns The bold label.
 */
const boldLine = (label: string, markup: NoticeMarkup): string =>
  markup.bold(markup.escape(label.replace(/\s+/g, ' ').trim()));

/**
 * Writes as many labelled details as fit, one to a line, cutting the value of the first that does not
 * fit whole and leaving out the rest.
 *
 * @param fields - The details.
 * @param markup - How the receiver escapes text and marks it bold.
 * @param room - The most they may take.
 * @returns The details that fit.
 */
const fitFields = (fields: NoticeField[], markup: NoticeMarkup, room: number): string => {
  const kept: string[] = [];
  let used = 0;

  for (const one of fields) {
    const label = `${boldLine(`${one.name}:`, markup)} `;
    const gap = kept.length === 0 ? 0 : 1;
    const line = `${label}${markup.escape(one.value)}`;

    if (used + gap + line.length <= room) {
      kept.push(line);
      used += gap + line.length;
      continue;
    }

    const left = room - used - gap - label.length;

    if (left > CUT_SHORT.length) {
      kept.push(`${label}${fitEscaped(one.value, left, markup.escape)}`);
    }

    break;
  }

  return kept.join('\n');
};

/**
 * Writes as many lines of the sections as fit, each under its heading, ending with an ellipsis where
 * any were left out.
 *
 * @param sections - The sections.
 * @param markup - How the receiver escapes text and marks it bold.
 * @param room - The most they may take.
 * @returns The lines that fit.
 */
const fitSections = (sections: NoticeSection[], markup: NoticeMarkup, room: number): string => {
  const lines = sections.flatMap((one, index) => [
    ...(index === 0 ? [] : ['']),
    boldLine(one.heading, markup),
    ...one.body.split('\n').map(markup.escape),
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
 * How much room is left once something has been written, with the break that follows it.
 *
 * @param room - The room there was.
 * @param written - What was written in it.
 * @returns The room left.
 */
const roomAfter = (room: number, written: string): number =>
  written === '' ? room : room - written.length - PARAGRAPH_BREAK.length;

/**
 * Writes a notice's summary, sections and labelled details as one message body in a receiver's own
 * markup, inside the most it will accept. The details are kept before the sections, and the sections
 * before the summary, which is left out once anything else has had to be cut, since the details are
 * what somebody acts on.
 *
 * @param notice - What to say.
 * @param markup - How the receiver escapes text and marks it bold.
 * @param limit - The most the receiver accepts in one body.
 * @returns The body.
 */
const noticeBodyOf = (
  notice: WebhookNotice,
  markup: NoticeMarkup,
  limit: number = Number.POSITIVE_INFINITY,
): string => {
  const fields = fitFields(notice.fields, markup, limit);
  const sections = fitSections(notice.sections, markup, roomAfter(limit, fields));
  const isEverySectionWhole =
    sections === fitSections(notice.sections, markup, Number.POSITIVE_INFINITY);
  const room = roomAfter(roomAfter(limit, fields), sections);
  const description =
    notice.description === '' || !isEverySectionWhole || room <= CUT_SHORT.length
      ? ''
      : fitEscaped(notice.description, room, markup.escape);

  return [description, sections, fields].filter((one) => one !== '').join(PARAGRAPH_BREAK);
};

export { noticeBodyOf };

export type { NoticeMarkup };
