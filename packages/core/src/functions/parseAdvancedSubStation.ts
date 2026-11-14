import { parseAssColour } from './parseAssColour';
import { parseAssOverrides } from './parseAssOverrides';
import { BOTTOM_CENTRE, readAssAlignment } from './readAssAlignment';
import { readAssTimestamp } from './readAssTimestamp';
import type { AssTextStyle } from './parseAssOverrides';

type AssSpan = Omit<AssTextStyle, 'fontSize'> & {
  text: string;
  fontHeight: number | null;
};

type AssMargins = {
  left: number;
  right: number;
  vertical: number;
};

type AssCue = {
  from: number;
  to: number;
  spans: AssSpan[];
  alignment: number;
  position: { x: number; y: number } | null;
  margins: AssMargins;
  isSign: boolean;
};

type AssScript = {
  cues: AssCue[];
};

type NamedStyle = {
  text: AssTextStyle;
  alignment: number;
  margins: AssMargins;
};

const DEFAULT_WIDTH = 384;

const DEFAULT_HEIGHT = 288;

const A_SECTION = /^\[(?<name>.+)\]\s*$/;

const AN_OVERRIDE = /\{(?<block>[^}]*)\}/g;

const PLAIN_STYLE: AssTextStyle = {
  fontFamily: null,
  fontSize: null,
  colour: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
};

const PLAIN_MARGINS: AssMargins = { left: 0, right: 0, vertical: 0 };

const STANDARD_EVENT_COLUMNS = [
  'layer',
  'start',
  'end',
  'style',
  'name',
  'marginl',
  'marginr',
  'marginv',
  'effect',
  'text',
];

const COLUMNS_A_LINE_NEEDS = ['start', 'end', 'text'];

const A_FORMAT_LINE = /^Format\s*:/;

const A_LINE_BREAK = /\r\n|\r|\n/;

const WIDE_WIDTH = 1280;

const WIDE_HEIGHT = 1024;

/**
 * The name a style is known by, which is how a line asks for it: whatever case it was written in,
 * and without the asterisk older scripts put in front of some style names.
 *
 * @param name - The style's name as written.
 * @returns The name to look it up by.
 */
const styleKey = (name: string): string => name.trim().replace(/^\*+/, '').toLowerCase();

/**
 * The resolution a script's positions, margins and sizes are written in. A script that declares one
 * side and not the other has the other worked out the way libass works it out: four by three, apart
 * from a width of 1280, which is the five by four 1280 by 1024. One declaring neither is taken at the
 * format's own default.
 *
 * @param width - The width it declares, where it declares one.
 * @param height - The height it declares, where it declares one.
 * @returns The width and height to read it at.
 */
const resolutionOf = (
  width: number | null,
  height: number | null,
): { width: number; height: number } => {
  if (width !== null && height !== null) {
    return { width, height };
  }

  if (width !== null) {
    return { width, height: width === WIDE_WIDTH ? WIDE_HEIGHT : (width * 3) / 4 };
  }

  if (height !== null) {
    return { width: (height * 4) / 3, height };
  }

  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
};

/**
 * Reads the columns a `Format:` line names, which is how these sections say what order they put
 * their fields in rather than relying on everyone agreeing.
 *
 * @param line - The `Format:` line.
 * @returns The column names, lowered, in the order they appear.
 */
const readFormat = (line: string): string[] =>
  line
    .slice(line.indexOf(':') + 1)
    .split(',')
    .map((column) => column.trim().toLowerCase());

/**
 * Takes one field out of a row by the name its section's `Format:` line gave that column.
 *
 * @param fields - The row, already split.
 * @param columns - What each column is called.
 * @param name - The column wanted.
 * @returns The field, or an empty string where this row has no such column.
 */
const fieldOf = (fields: string[], columns: string[], name: string): string => {
  const at = columns.indexOf(name);

  return at === -1 ? '' : (fields[at] ?? '').trim();
};

/**
 * Reads a `Style:` row into the lettering, alignment and margins a line naming that style starts
 * with.
 *
 * @param fields - The row, already split.
 * @param columns - What each column is called.
 * @param isLegacy - Whether this script numbers its alignments the older way.
 * @returns The style.
 */
const readStyle = (fields: string[], columns: string[], isLegacy: boolean): NamedStyle => {
  const primary = parseAssColour(fieldOf(fields, columns, 'primarycolour'));
  const size = Number(fieldOf(fields, columns, 'fontsize'));
  const font = fieldOf(fields, columns, 'fontname');

  const flag = (name: string): boolean => {
    const value = Number(fieldOf(fields, columns, name));

    return Number.isFinite(value) && value !== 0;
  };

  const margin = (name: string): number => {
    const value = Number(fieldOf(fields, columns, name));

    return Number.isFinite(value) ? value : 0;
  };

  return {
    text: {
      fontFamily: font === '' ? null : font,
      fontSize: Number.isFinite(size) && size > 0 ? size : null,
      colour: primary?.colour ?? null,
      opacity: primary?.opacity ?? null,
      isBold: flag('bold'),
      isItalic: flag('italic'),
      isUnderlined: flag('underline'),
      isStruckThrough: flag('strikeout'),
    },
    alignment: readAssAlignment(fieldOf(fields, columns, 'alignment'), isLegacy) ?? BOTTOM_CENTRE,
    margins: {
      left: margin('marginl'),
      right: margin('marginr'),
      vertical: margin('marginv'),
    },
  };
};

/**
 * Turns the escapes a script writes inside its text into the characters they stand for — its two
 * spellings of a line break, and its hard space.
 *
 * @param text - A run of text between override blocks.
 * @returns The same run, as characters.
 */
const readEscapes = (text: string): string =>
  text.replaceAll(/\\N/g, '\n').replaceAll(/\\n/g, '\n').replaceAll(/\\h/g, ' ');

/**
 * Splits a line's text into runs of one appearance each, applying the override blocks as they are
 * met.
 *
 * A block describes the lettering from where it sits to the end of the line or to the next block, so
 * a line reading `{\i1}sign{\i0} here` is three runs of which one is italic. `\r` starts over from
 * the line's own style, or from the style it names, which is how a script ends an override without
 * spelling out its opposite.
 *
 * Two kinds of run are left out because there are no words in them to read. A run drawn in vector
 * mode, between `\p1` and `\p0`, is the outline of a shape written as coordinates. A run the script
 * made fully transparent, and never fades in, is there to hold space.
 *
 * @param text - The line's text column, escapes and braces and all.
 * @param base - The lettering the line's named style starts it with.
 * @param styleNamed - The lettering of another style in the script, by name, for `\r` to start over
 *   from.
 * @returns The runs, and anything the blocks said about where the whole line sits.
 */
const readSpans = (
  text: string,
  base: AssTextStyle,
  styleNamed: (name: string) => AssTextStyle | undefined,
): {
  spans: (AssTextStyle & { text: string })[];
  alignment: number | null;
  position: { x: number; y: number } | null;
  restsAt: { x: number; y: number } | null;
} => {
  const spans: (AssTextStyle & { text: string })[] = [];

  let current: AssTextStyle = { ...base };
  let alignment: number | null = null;
  let position: { x: number; y: number } | null = null;
  let restsAt: { x: number; y: number } | null = null;
  let isDrawing = false;
  let at = 0;

  const take = (raw: string): void => {
    const said = readEscapes(raw);

    if (said !== '' && !isDrawing && current.opacity !== 0) {
      spans.push({ ...current, text: said });
    }
  };

  for (const match of text.matchAll(AN_OVERRIDE)) {
    take(text.slice(at, match.index));

    const overrides = parseAssOverrides(match.groups?.['block'] ?? '');
    const startsFrom =
      overrides.reset === null
        ? current
        : overrides.reset === ''
          ? base
          : (styleNamed(overrides.reset) ?? base);

    const dressed = { ...startsFrom, ...overrides.style };

    current =
      overrides.fadesTo === null || dressed.opacity === null
        ? dressed
        : { ...dressed, opacity: Math.max(dressed.opacity, overrides.fadesTo) };
    alignment = overrides.alignment ?? alignment;
    position = overrides.position ?? position;
    restsAt = overrides.restsAt ?? restsAt;
    isDrawing = overrides.drawing === null ? isDrawing : overrides.drawing > 0;
    at = match.index + match[0].length;
  }

  take(text.slice(at));

  return { spans, alignment, position, restsAt };
};

/**
 * Reads an Advanced SubStation script into lines that keep what they were dressed in.
 *
 * The format carries far more than the words: a `[V4+ Styles]` section naming the lettering a line
 * can ask for, and override blocks inside a line changing it partway. Most of that describes how a
 * line looks, and some of it — `\pos` and the alignments — describes where on the picture it goes,
 * which is the difference between a subtitle and a sign painted on a shop window.
 *
 * Positions, margins and lettering sizes are written in the script's own coordinates, which
 * `[Script Info]` declares and which are not the video's. They all come back as fractions of the
 * picture — a size of `0.0667` being a fifteenth of its height — so that whatever draws them need
 * not know what the script thought it was being shown at, and so a script written for one resolution
 * looks the same shown at another.
 *
 * A line is taken for a sign where the script put it at a point of its own, with `\pos` or `\move`.
 * Every other line is read in a row — along the foot, through the middle or across the top, as its
 * alignment says — the way dialogue is, since a line moved to the top to clear the one below it, or
 * a song's words, is still something to read rather than a shop window. That is a structural
 * question rather than a question about what the style was called, so it survives a script whose
 * styles are named in a language nobody here reads. A moving line is placed where it comes to rest,
 * or where it starts where it comes to rest off the picture.
 *
 * The text is the last column a script declares, and is put there so that a line containing commas
 * needs no escaping — so everything from that column on is the line, rather than that column alone.
 * Where the events section names no columns, or names them without the start, end and text, the
 * order every tool writes is assumed, as libass assumes it. A line naming a style the script never
 * defined is dressed in its Default style, as libass dresses it, and a style named with a leading
 * asterisk answers to its name without one. A script declaring the width it was written for and not
 * the height, or the reverse, has the other worked out as libass works it out.
 *
 * @param source - The script.
 * @returns Its lines.
 */
const parseAdvancedSubStation = (source: string): AssScript => {
  const styles = new Map<string, NamedStyle>();
  const cues: AssCue[] = [];

  let section = '';
  let isLegacy = false;
  let styleColumns: string[] = [];
  let eventColumns = STANDARD_EVENT_COLUMNS;
  let declaredWidth: number | null = null;
  let declaredHeight: number | null = null;

  for (const written of source.split(A_LINE_BREAK)) {
    const line = written.trimStart();
    const heading = A_SECTION.exec(line.trim());

    if (heading !== null) {
      section = (heading.groups?.['name'] ?? '').toLowerCase();
      isLegacy = section === 'v4 styles';

      continue;
    }

    if (section === 'script info') {
      const declared = /^playres([xy])\s*:\s*(\d+)/i.exec(line.trim());

      if (declared !== null) {
        const value = Number(declared[2]);

        if (value > 0) {
          if ((declared[1] ?? '').toLowerCase() === 'x') {
            declaredWidth = value;
          } else {
            declaredHeight = value;
          }
        }
      }

      continue;
    }

    if (A_FORMAT_LINE.test(line)) {
      const columns = readFormat(line);

      if (section.endsWith('styles')) {
        styleColumns = columns;
      }

      if (section === 'events') {
        eventColumns = COLUMNS_A_LINE_NEEDS.every((name) => columns.includes(name))
          ? columns
          : STANDARD_EVENT_COLUMNS;
      }

      continue;
    }

    if (line.startsWith('Style:') && styleColumns.length > 0) {
      const fields = line.slice('Style:'.length).split(',');
      const name = fieldOf(fields, styleColumns, 'name');

      if (name !== '') {
        styles.set(styleKey(name), readStyle(fields, styleColumns, isLegacy));
      }

      continue;
    }

    if (!line.startsWith('Dialogue:')) {
      continue;
    }

    const fields = line.slice('Dialogue:'.length).split(',');
    const from = readAssTimestamp(fieldOf(fields, eventColumns, 'start'));
    const to = readAssTimestamp(fieldOf(fields, eventColumns, 'end'));
    const textColumn = eventColumns.indexOf('text');

    if (from === null || to === null || textColumn === -1) {
      continue;
    }

    const named =
      styles.get(styleKey(fieldOf(fields, eventColumns, 'style'))) ?? styles.get('default');
    const base = named?.text ?? PLAIN_STYLE;

    const said =
      textColumn === eventColumns.length - 1
        ? fields.slice(textColumn).join(',')
        : (fields[textColumn] ?? '');

    const read = readSpans(said, base, (name) => styles.get(styleKey(name))?.text);

    if (read.spans.every((span) => span.text.trim() === '')) {
      continue;
    }

    const { width, height } = resolutionOf(declaredWidth, declaredHeight);

    const spans = read.spans.map(({ fontSize, ...rest }) => ({
      ...rest,
      fontHeight: fontSize === null ? null : fontSize / height,
    }));

    const rowMargin = (name: string, fallback: number): number => {
      const value = Number(fieldOf(fields, eventColumns, name));

      return Number.isFinite(value) && value !== 0 ? value : fallback;
    };

    const margins = named?.margins ?? PLAIN_MARGINS;
    const alignment = read.alignment ?? named?.alignment ?? BOTTOM_CENTRE;
    const isOnThePicture = (point: { x: number; y: number }): boolean =>
      point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
    const point =
      read.restsAt !== null && isOnThePicture(read.restsAt) ? read.restsAt : read.position;
    const position =
      point === null
        ? null
        : {
            x: Math.min(Math.max(point.x / width, 0), 1),
            y: Math.min(Math.max(point.y / height, 0), 1),
          };

    cues.push({
      from,
      to,
      spans,
      alignment,
      position,
      margins: {
        left: rowMargin('marginl', margins.left) / width,
        right: rowMargin('marginr', margins.right) / width,
        vertical: rowMargin('marginv', margins.vertical) / height,
      },
      isSign: position !== null,
    });
  }

  return { cues };
};

export type { AssCue, AssMargins, AssScript, AssSpan };

export { parseAdvancedSubStation };
