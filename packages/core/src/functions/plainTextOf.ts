const NAMED: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

const MOST_UNWRAPPINGS = 4;

/**
 * Spells out every entity in some text once.
 *
 * @param text - The text.
 * @returns It with each entity it knows replaced by what it stands for.
 */
const spellOut = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, name: string) => {
    const isHex = name.startsWith('#x') || name.startsWith('#X');

    if (isHex || name.startsWith('#')) {
      const code = Number.parseInt(name.slice(isHex ? 2 : 1), isHex ? 16 : 10);

      if (code === 0) {
        return '\uFFFD';
      }

      return code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)
        ? whole
        : String.fromCodePoint(code);
    }

    return NAMED[name.toLowerCase()] ?? whole;
  });

/**
 * Turns marked-up text into what a reader should see: entities spelled out — however many times
 * over they were escaped, as a description copied between catalogues often is — tags dropped, a
 * break or the end of a paragraph kept as a new line, and runs of spaces made one.
 *
 * @param text - The text, as written.
 * @returns What it says, as plain text.
 */
const plainTextOf = (text: string): string => {
  let unwrapped = text;

  for (let round = 0; round < MOST_UNWRAPPINGS; round += 1) {
    const next = spellOut(unwrapped);

    if (next === unwrapped) {
      break;
    }

    unwrapped = next;
  }

  return spellOut(
    unwrapped
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export { plainTextOf };
