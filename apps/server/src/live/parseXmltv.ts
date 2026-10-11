import { xmlTextOf } from './xmlTextOf';
import { xmltvTimeOf } from './xmltvTimeOf';
import type { ParsedProgramme } from './ParsedProgramme';

const PROGRAMME = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/giu;

const CHANNEL = /<channel\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/channel>/giu;

/**
 * The value of one attribute in an element's opening tag.
 *
 * @param attributes - The text of the opening tag after its name.
 * @param name - The attribute.
 * @returns Its value, or nothing.
 */
const attributeOf = (attributes: string, name: string): string | null =>
  new RegExp(`\\b${name}="([^"]*)"`, 'u').exec(attributes)?.[1] ?? null;

/**
 * What the first of a child element says, such as a programme's `<title>`.
 *
 * @param body - The parent element's contents.
 * @param name - The child element.
 * @returns What it says, or nothing where it is missing or empty.
 */
const childOf = (body: string, name: string): string | null => {
  const found = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'u').exec(body)?.[1];
  const text = found === undefined ? '' : xmlTextOf(found);

  return text === '' ? null : text;
};

/**
 * Reads an XMLTV guide: what each programme is, on which channel, from when until when, and the
 * names it gives each channel, so a playlist whose channels name no guide id can still be matched by
 * name. Programmes that have already ended before `from`, or start after `until`, are left out, so a
 * guide that runs for weeks keeps only the days worth showing.
 *
 * @param text - The guide.
 * @param window - The span of time to keep.
 * @returns Its programmes, and its channels' names by guide id.
 */
const parseXmltv = (
  text: string,
  window: { from: Date; until: Date },
): { programmes: ParsedProgramme[]; names: Map<string, string[]> } => {
  const names = new Map<string, string[]>();

  for (const [, id, body] of text.matchAll(CHANNEL)) {
    if (id !== undefined && body !== undefined) {
      names.set(
        xmlTextOf(id),
        [...body.matchAll(/<display-name\b[^>]*>([\s\S]*?)<\/display-name>/giu)].flatMap((found) =>
          found[1] === undefined ? [] : [xmlTextOf(found[1])],
        ),
      );
    }
  }

  const programmes: ParsedProgramme[] = [];

  for (const [, attributes, body] of text.matchAll(PROGRAMME)) {
    const channel = attributes === undefined ? null : attributeOf(attributes, 'channel');
    const startsAt = xmltvTimeOf(attributeOf(attributes ?? '', 'start') ?? '');
    const endsAt = xmltvTimeOf(attributeOf(attributes ?? '', 'stop') ?? '');
    const title = childOf(body ?? '', 'title');

    if (
      channel !== null &&
      startsAt !== null &&
      endsAt !== null &&
      title !== null &&
      endsAt > window.from &&
      startsAt < window.until
    ) {
      programmes.push({
        guideId: xmlTextOf(channel),
        startsAt,
        endsAt,
        title,
        subtitle: childOf(body ?? '', 'sub-title'),
        description: childOf(body ?? '', 'desc'),
        category: childOf(body ?? '', 'category'),
      });
    }
  }

  return { programmes, names };
};

export { parseXmltv };
