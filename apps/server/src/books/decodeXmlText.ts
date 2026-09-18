const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Turns the text of an XML element into what it says: tags inside it dropped, entities spelled out,
 * and runs of whitespace — which a machine-written document is full of — made single spaces.
 *
 * @param text - The element's contents, as written.
 * @returns What a reader would see.
 */
const decodeXmlText = (text: string): string =>
  text
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, name: string) => {
      if (name.startsWith('#x') || name.startsWith('#X')) {
        return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      }

      if (name.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
      }

      return NAMED[name.toLowerCase()] ?? whole;
    })
    .replace(/\s+/g, ' ')
    .trim();

export { decodeXmlText };
