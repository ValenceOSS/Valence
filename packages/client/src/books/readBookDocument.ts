import type { BookNode } from './readBookDocument.types';

const EMPTY_TAGS: ReadonlySet<string> = new Set(['br', 'hr', 'img']);

const NAMED: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  shy: '­',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

const PIECES =
  /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>|<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>|[^<]+|</g;

const ATTRIBUTES = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

/**
 * Turns the character references in a piece of text back into the characters they stand for.
 *
 * @param text - The text, as written in the document.
 * @returns The text as read.
 */
const decode = (text: string): string =>
  text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, name: string) => {
    if (name.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    }

    if (name.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    }

    return NAMED[name] ?? whole;
  });

/**
 * Reads the attributes written inside an opening tag.
 *
 * @param written - Everything in the tag after its name.
 * @returns Each attribute's value by its name, lower-cased.
 */
const attributesIn = (written: string): Record<string, string> => {
  const found: Record<string, string> = {};

  for (const match of written.matchAll(ATTRIBUTES)) {
    const name = match[1];

    if (name !== undefined) {
      found[name.toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
    }
  }

  return found;
};

/**
 * Reads one part of a book, as the server sends it — HTML already cut down to the tags a book is
 * written in — into a tree a phone can draw without a browser to parse it.
 *
 * It forgives what a browser forgives: a tag closed that was never opened is ignored, one left open
 * is closed with whatever held it, and comments are dropped.
 *
 * @param html - The part, as HTML.
 * @returns Its contents, in order.
 */
const readBookDocument = (html: string): BookNode[] => {
  const root: { tag: string; children: BookNode[] } = { tag: '', children: [] };
  const open: { tag: string; attributes: Record<string, string>; children: BookNode[] }[] = [];

  /**
   * Where the next thing read belongs.
   *
   * @returns The children of whatever is open, or of the document itself.
   */
  const into = (): BookNode[] => open.at(-1)?.children ?? root.children;

  /**
   * Closes whatever is open innermost, adding it to whatever held it.
   */
  const close = () => {
    const done = open.pop();

    if (done !== undefined) {
      into().push({
        kind: 'element',
        tag: done.tag,
        attributes: done.attributes,
        children: done.children,
      });
    }
  };

  for (const match of html.matchAll(PIECES)) {
    const [whole, closing, opening, written] = match;

    if (whole.startsWith('<!--')) {
      continue;
    }

    if (closing !== undefined) {
      const tag = closing.toLowerCase();

      if (open.some((element) => element.tag === tag)) {
        while (open.at(-1)?.tag !== tag) {
          close();
        }

        close();
      }

      continue;
    }

    if (opening !== undefined) {
      const tag = opening.toLowerCase();
      const attributes = attributesIn(written ?? '');

      if (EMPTY_TAGS.has(tag) || whole.endsWith('/>')) {
        into().push({ kind: 'element', tag, attributes, children: [] });
      } else {
        open.push({ tag, attributes, children: [] });
      }

      continue;
    }

    into().push({ kind: 'text', text: decode(whole) });
  }

  while (open.length > 0) {
    close();
  }

  return root.children;
};

export { readBookDocument };
