const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/**
 * Turns XML text back into what it says: its entities and character references read, and any
 * CDATA wrapping taken off.
 *
 * @param text - The text as it stands in the XML.
 * @returns What it says.
 */
const xmlTextOf = (text: string): string =>
  text
    .replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/u, '$1')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/giu, (whole, name: string) => {
      if (name.startsWith('#x') || name.startsWith('#X')) {
        return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      }

      if (name.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
      }

      return ENTITIES[name.toLowerCase()] ?? whole;
    })
    .trim();

export { xmlTextOf };
