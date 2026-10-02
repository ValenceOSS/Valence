type XmlElement = {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
};

const TAG = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;

const ATTRIBUTE = /([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/**
 * Turns the character references in an attribute's value back into the characters they stand for.
 *
 * @param text - The value as written.
 * @returns The value as meant.
 */
const decode = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return ENTITIES[entity.toLowerCase()] ?? whole;
  });

/**
 * Reads the elements of a Plex XML answer as a tree of names and attributes, which is all Plex puts
 * in one: text between tags, comments and declarations are passed over.
 *
 * @param xml - The answer.
 * @returns The elements at the top of the document, each with its children.
 */
const readXmlElements = (xml: string): XmlElement[] => {
  const top: XmlElement[] = [];
  const open: XmlElement[] = [];

  for (const match of xml.matchAll(TAG)) {
    const [, closing = '', name = '', attributeText = '', selfClosing = ''] = match;

    if (closing === '/') {
      const at = open.map((element) => element.name).lastIndexOf(name);

      if (at >= 0) {
        open.length = at;
      }

      continue;
    }

    const attributes: Record<string, string> = {};

    for (const [, key = '', double, single] of attributeText.matchAll(ATTRIBUTE)) {
      attributes[key] = decode(double ?? single ?? '');
    }

    const element: XmlElement = { name, attributes, children: [] };
    const parent = open.at(-1);

    if (parent === undefined) {
      top.push(element);
    } else {
      parent.children.push(element);
    }

    if (selfClosing !== '/') {
      open.push(element);
    }
  }

  return top;
};

export type { XmlElement };

export { readXmlElements };
