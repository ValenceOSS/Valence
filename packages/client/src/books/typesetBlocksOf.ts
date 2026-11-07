import type { BookNode } from './readBookDocument.types';
import type { TypesetBlock, TypesetRun } from './TypesetBlock';

const BLOCK_TAGS: ReadonlySet<string> = new Set([
  'p',
  'div',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'li',
  'dd',
  'dt',
  'figure',
  'figcaption',
  'pre',
  'table',
  'tr',
]);

const KINDS: Readonly<Record<string, TypesetBlock['kind']>> = {
  h1: 'title',
  h2: 'heading',
  h3: 'subheading',
  h4: 'subheading',
  h5: 'subheading',
  h6: 'subheading',
  blockquote: 'quote',
};

const ITALIC: ReadonlySet<string> = new Set(['em', 'i', 'cite', 'var']);

const BOLD: ReadonlySet<string> = new Set(['strong', 'b']);

/**
 * A chapter's text as the blocks a typesetter sets it in: each paragraph, heading and quotation as
 * runs of words in roman, italic or bold, with the places within it the book's contents and links
 * name, and a break where the book draws a rule. Pictures are left out, since a page set this way is
 * words alone.
 *
 * @param nodes - The chapter, as read from its document.
 * @returns Its blocks, in order.
 */
const typesetBlocksOf = (nodes: readonly BookNode[]): TypesetBlock[] => {
  const blocks: TypesetBlock[] = [];
  let open: TypesetBlock | null = null;
  let waiting: string[] = [];

  const close = () => {
    if (open !== null) {
      const runs = open.runs
        .map((run, at, all) => ({
          ...run,
          text:
            at === 0 ? run.text.trimStart() : at === all.length - 1 ? run.text.trimEnd() : run.text,
        }))
        .filter((run) => run.text !== '');

      if (runs.length > 0 || open.anchors.length > 0) {
        blocks.push({ ...open, runs });
      }
    }

    open = null;
  };

  const begin = (kind: TypesetBlock['kind']) => {
    close();
    open = { kind, runs: [], anchors: waiting };
    waiting = [];
  };

  const add = (run: TypesetRun) => {
    if (open === null) {
      if (run.text.trim() === '') {
        return;
      }

      begin('paragraph');
    }

    const last = open?.runs.at(-1);

    if (last !== undefined && last.isItalic === run.isItalic && last.isBold === run.isBold) {
      last.text = `${last.text}${run.text}`.replace(/ {2,}/g, ' ');
    } else {
      open?.runs.push(run);
    }
  };

  const walk = (node: BookNode, isItalic: boolean, isBold: boolean, kind: TypesetBlock['kind']) => {
    if (node.kind === 'text') {
      add({ text: node.text.replace(/\s+/g, ' '), isItalic, isBold });

      return;
    }

    const name = node.attributes['id'] ?? node.attributes['name'];

    if (name !== undefined) {
      if (open === null) {
        waiting = [...waiting, name];
      } else {
        open.anchors.push(name);
      }
    }

    if (node.tag === 'img' || node.tag === 'script' || node.tag === 'style') {
      return;
    }

    if (node.tag === 'hr') {
      begin('break');
      close();

      return;
    }

    if (node.tag === 'br') {
      add({ text: ' ', isItalic, isBold });

      return;
    }

    const own = KINDS[node.tag];
    const isBlock = own !== undefined || BLOCK_TAGS.has(node.tag);
    const kindHere = own ?? kind;

    if (isBlock) {
      begin(kindHere);
    }

    for (const child of node.children) {
      walk(child, isItalic || ITALIC.has(node.tag), isBold || BOLD.has(node.tag), kindHere);
    }

    if (isBlock) {
      close();
    }
  };

  for (const node of nodes) {
    walk(node, false, false, 'paragraph');
  }

  close();

  return blocks;
};

export { typesetBlocksOf };
