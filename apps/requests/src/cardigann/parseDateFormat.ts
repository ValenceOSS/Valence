import { MONTHS } from '@ValenceRequests/cardigann/MONTHS';

type Part = { kind: 'literal'; text: string } | { kind: 'field'; letter: string; length: number };

const LETTERS = 'yMdHhmsfFtzK';

const GO_TO_DOTNET: readonly (readonly [string, string])[] = [
  ['January', 'MMMM'],
  ['Monday', 'dddd'],
  ['2006', 'yyyy'],
  ['-07:00', 'zzz'],
  ['Z07:00', 'zzz'],
  ['-0700', 'zzz'],
  ['Jan', 'MMM'],
  ['Mon', 'ddd'],
  ['MST', ''],
  ['06', 'yy'],
  ['01', 'MM'],
  ['02', 'dd'],
  ['15', 'HH'],
  ['03', 'hh'],
  ['04', 'mm'],
  ['05', 'ss'],
  ['PM', 'tt'],
  ['pm', 'tt'],
  ['1', 'M'],
  ['2', 'd'],
  ['3', 'h'],
  ['4', 'm'],
  ['5', 's'],
];

/**
 * Turns a Go reference layout, such as `2006-01-02 15:04`, into the .NET format that means the same.
 *
 * @param layout - The Go layout.
 * @returns The .NET format.
 */
const fromGoLayout = (layout: string): string => {
  let format = '';
  let rest = layout;

  while (rest !== '') {
    const match = GO_TO_DOTNET.find(([go]) => rest.startsWith(go));

    if (match === undefined) {
      format += /[a-zA-Z]/.test(rest[0] ?? '') ? `'${rest[0] ?? ''}'` : (rest[0] ?? '');
      rest = rest.slice(1);
    } else {
      format += match[1];
      rest = rest.slice(match[0].length);
    }
  }

  return format;
};

/**
 * Splits a .NET custom date format into its fields and the literal text between them.
 *
 * @param format - Such as `dd.MM.yyyy HH:mm zzz`.
 * @returns The parts.
 */
const partsOf = (format: string): Part[] => {
  const parts: Part[] = [];
  let at = 0;

  while (at < format.length) {
    const character = format[at] ?? '';

    if (character === "'" || character === '"') {
      const end = format.indexOf(character, at + 1);
      const text = format.slice(at + 1, end === -1 ? undefined : end);

      parts.push({ kind: 'literal', text });
      at = end === -1 ? format.length : end + 1;
    } else if (character === '\\') {
      parts.push({ kind: 'literal', text: format[at + 1] ?? '' });
      at += 2;
    } else if (LETTERS.includes(character)) {
      let length = 1;

      while (format[at + length] === character) {
        length += 1;
      }

      parts.push({ kind: 'field', letter: character, length });
      at += length;
    } else {
      parts.push({ kind: 'literal', text: character });
      at += 1;
    }
  }

  return parts;
};

/**
 * The pattern that reads one field.
 *
 * @param part - The field.
 * @returns The pattern, capturing what it reads.
 */
const patternFor = ({ letter, length }: { letter: string; length: number }): string => {
  switch (letter) {
    case 'y':
      return length === 2 ? '(\\d{2})' : length === 1 ? '(\\d{1,2})' : '(\\d{4})';
    case 'M':
      return length >= 3
        ? '([A-Za-z\\u00C0-\\u024F]+\\.?)'
        : length === 2
          ? '(\\d{2})'
          : '(\\d{1,2})';
    case 'd':
      return length >= 3 ? '([A-Za-z]+\\.?)' : length === 2 ? '(\\d{2})' : '(\\d{1,2})';
    case 'H':
    case 'h':
    case 'm':
    case 's':
      return length === 2 ? '(\\d{2})' : '(\\d{1,2})';
    case 'f':
      return `(\\d{${length.toString()}})`;
    case 'F':
      return `(\\d{0,${length.toString()}})`;
    case 't':
      return '([AaPp][Mm]?)';
    default:
      return '(Z|[+-]\\d{1,2}(?::?\\d{2})?)';
  }
};

/**
 * Reads a date in exactly the layout given, the way .NET's custom formats describe one — which is
 * how definitions write theirs: `yyyy-MM-dd HH:mm:ss zzz`, `MMM d yyyy hh:mm tt`. A layout that is
 * instead a Go reference layout, such as `Jan 2, 2006`, is read as that.
 *
 * Month names are English, as is every site's that writes them. A date with no offset is taken as
 * UTC, and a two-digit year as this century up to '49.
 *
 * @param text - The date as written.
 * @param layout - How it is written.
 * @returns The moment, or null where the text is not in that layout.
 */
const parseDateFormat = (text: string, layout: string): Date | null => {
  const isGo = !/[yHhdms]/.test(layout.replace(/Mon(day)?|January|MST/g, ''));
  const parts = partsOf(isGo ? fromGoLayout(layout) : layout);
  const fields = parts.flatMap((part) => (part.kind === 'field' ? [part] : []));
  const source = parts
    .map((part) =>
      part.kind === 'literal'
        ? part.text === ' '
          ? '\\s+'
          : part.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        : patternFor(part),
    )
    .join('');
  const match = new RegExp(`^${source}$`, 'i').exec(text.trim());

  if (match === null) {
    return null;
  }

  const found: Record<string, string> = {};

  fields.forEach((field, index) => {
    found[field.letter + (field.letter === 'M' && field.length >= 3 ? 'name' : '')] =
      match[index + 1] ?? '';
  });

  const monthName = found['Mname']?.toLowerCase().replace('.', '') ?? '';
  const month =
    monthName === ''
      ? Number(found['M'] ?? 1)
      : MONTHS.findIndex((name) => name.startsWith(monthName.slice(0, 3))) + 1;
  const rawYear = found['y'] ?? new Date().getUTCFullYear().toString();
  const year =
    rawYear.length <= 2 ? (Number(rawYear) < 50 ? 2000 : 1900) + Number(rawYear) : Number(rawYear);
  const twelve = found['h'];
  const meridiem = (found['t'] ?? '').toLowerCase();
  const hour =
    twelve === undefined
      ? Number(found['H'] ?? 0)
      : (Number(twelve) % 12) + (meridiem.startsWith('p') ? 12 : 0);
  const fraction = found['f'] ?? found['F'] ?? '';
  const zone = found['z'] ?? found['K'] ?? 'Z';
  const offset = /^([+-])(\d{1,2}):?(\d{2})?$/.exec(zone);
  const offsetMinutes =
    offset === null
      ? 0
      : (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3] ?? 0));

  if (month < 1 || month > 12) {
    return null;
  }

  const moment = new Date(
    Date.UTC(
      year,
      month - 1,
      Number(found['d'] ?? 1),
      hour,
      Number(found['m'] ?? 0),
      Number(found['s'] ?? 0),
      Math.round(Number(`0.${fraction || '0'}`) * 1000),
    ) -
      offsetMinutes * 60_000,
  );

  return Number.isNaN(moment.getTime()) ? null : moment;
};

export { parseDateFormat };
