import { memo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { ABookPicture } from '@ValenceMobile/components/AReader/components/ATextReader/components/TheBookText/components/ABookPicture/ABookPicture';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { say } from '@ValenceI18n/say';
import type { BookNode } from '@ValenceClient/books/readBookDocument.types';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import type { TheBookTextProps } from './TheBookText.types';

const BLOCKS: ReadonlySet<string> = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'figure',
  'figcaption',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'hr',
  'img',
]);

const INLINE: Readonly<Record<string, TextStyle>> = {
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  cite: { fontStyle: 'italic' },
  strong: { fontFamily: FONTS.body.bold },
  b: { fontFamily: FONTS.body.bold },
  u: { textDecorationLine: 'underline' },
  a: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  code: { fontFamily: 'Menlo' },
};

const SMALLER: Readonly<Record<string, number>> = { small: 0.85, sub: 0.75, sup: 0.75, code: 0.9 };

const HEADINGS: Readonly<Record<string, { family: string; scale: number }>> = {
  h1: { family: FONTS.sans.bold, scale: 1.5 },
  h2: { family: FONTS.sans.bold, scale: 1.3 },
  h3: { family: FONTS.sans.semibold, scale: 1.15 },
  h4: { family: FONTS.sans.semibold, scale: 1.05 },
  h5: { family: FONTS.sans.semibold, scale: 1 },
  h6: { family: FONTS.sans.semibold, scale: 1 },
};

const styles = StyleSheet.create({
  block: { gap: 14 },
  body: { fontFamily: FONTS.body.regular },
  indented: { gap: 14, paddingLeft: 18 },
  link: { textDecorationLine: 'underline' },
  rule: { alignSelf: 'center', height: StyleSheet.hairlineWidth, marginVertical: 8, width: '40%' },
});

/**
 * The names of the places within a node — its own and those of everything in it.
 *
 * @param node - The node.
 * @returns Every name.
 */
const namesIn = (node: BookNode): string[] =>
  node.kind === 'text'
    ? []
    : [
        ...(node.attributes['id'] === undefined ? [] : [node.attributes['id']]),
        ...node.children.flatMap(namesIn),
      ];

/**
 * The words in a node, run together.
 *
 * @param node - The node.
 * @returns Its words.
 */
const textOf = (node: BookNode): string =>
  node.kind === 'text' ? node.text.trim() : node.children.map(textOf).join(' ').trim();

/**
 * Whether a node draws as a block of its own rather than running on in a line of text.
 *
 * @param node - The node.
 * @returns Whether it is a block.
 */
const isABlock = (node: BookNode) => node.kind === 'element' && BLOCKS.has(node.tag);

/**
 * A part of a book's text, drawn from the tree the server's HTML was read into, as the web draws it
 * from the same HTML: paragraphs and headings as blocks, emphasis and the like running on within
 * them, pictures as wide as the text, and whitespace folded as a browser folds it. It is set at the
 * size and spacing somebody chose, in the ink of the page they chose, headings scaled from it.
 *
 * A link can be followed: one to another place in the book is handed back to the reader, and one out
 * of it to the phone. Where each named place in the part sits is told to the reader once it is laid
 * out, as far down as the top of the block it is in, so a link to it lands on the right page.
 *
 * @param nodes - The part, read.
 * @param size - How large the words are.
 * @param leading - How far apart its lines are, as a multiple of the size.
 * @param ink - The colour of the words.
 * @param onLink - Told a link was followed.
 * @param onAnchors - Told where the named places are.
 */
const TheBookTextDrawn = ({ nodes, size, leading, ink, onLink, onAnchors }: TheBookTextProps) => {
  const anchors = useRef(new Map<string, number>());

  /**
   * Notes where the named places in one block are, and tells the reader.
   *
   * @param node - The block.
   * @param y - How far down it sits.
   */
  const noteAnchors = (node: BookNode, y: number) => {
    const named = namesIn(node);

    if (named.length === 0) {
      return;
    }

    named.forEach((name) => anchors.current.set(name, y));
    onAnchors(new Map(anchors.current));
  };
  /**
   * How a heading is set, scaled from the size of the words around it.
   *
   * @param tag - The block's tag.
   * @returns Its look, or nothing where it is not a heading.
   */
  const headingLook = (tag: string): TextStyle | undefined => {
    const heading = HEADINGS[tag];

    return heading === undefined
      ? undefined
      : {
          fontFamily: heading.family,
          fontSize: size * heading.scale,
          lineHeight: size * heading.scale * 1.25,
        };
  };

  /**
   * Draws a run of text and the elements within it.
   *
   * @param node - What to draw.
   * @param key - Where it is among its neighbours.
   * @param isKept - Whether its whitespace is kept as written, as in preformatted text.
   * @returns It, as text.
   */
  const drawRun = (node: BookNode, key: number, isKept: boolean): ReactNode => {
    if (node.kind === 'text') {
      return isKept ? node.text : node.text.replace(/\s+/g, ' ');
    }

    if (node.tag === 'br') {
      return '\n';
    }

    const smaller = SMALLER[node.tag];
    const href = node.attributes['href'];

    if (node.tag === 'a' && href !== undefined) {
      return (
        <Button
          key={key}
          tone="bare"
          label={
            textOf(node) === ''
              ? say('phone.theBookText.followLinkElsewhere')
              : say('phone.theBookText.followLink', { place: textOf(node) })
          }
          onPress={() => {
            onLink(href);
          }}
        >
          <Text style={[styles.body, styles.link, { color: ink, fontSize: size }]}>
            {node.children.map((child, at) => drawRun(child, at, isKept))}
          </Text>
        </Button>
      );
    }

    return (
      <Text
        key={key}
        style={[INLINE[node.tag], smaller === undefined ? null : { fontSize: size * smaller }]}
      >
        {node.children.map((child, at) => drawRun(child, at, isKept))}
      </Text>
    );
  };

  /**
   * Draws a run of what runs on as one paragraph, unless it was only space.
   *
   * @param run - What runs on.
   * @param key - Where it is among its neighbours.
   * @param look - How any text in it looks.
   * @param isKept - Whether whitespace is kept as written.
   * @returns The paragraph, or nothing.
   */
  const drawParagraph = (
    run: readonly BookNode[],
    key: number,
    look: TextStyle | undefined,
    isKept: boolean,
  ): ReactNode =>
    run.every((node) => node.kind === 'text' && node.text.trim() === '') ? null : (
      <Text
        key={key}
        style={[styles.body, { color: ink, fontSize: size, lineHeight: size * leading }, look]}
      >
        {run.map((node, at) => drawRun(node, at, isKept))}
      </Text>
    );

  /**
   * Draws a list of nodes, gathering what runs on into paragraphs and drawing blocks as blocks.
   *
   * @param children - The nodes.
   * @param look - How any text among them looks.
   * @param isKept - Whether whitespace is kept as written.
   * @returns Them, drawn.
   */
  const drawAll = (
    children: readonly BookNode[],
    look: TextStyle | undefined,
    isKept: boolean,
  ): ReactNode[] =>
    children
      .reduce<(BookNode | BookNode[])[]>((gathered, node) => {
        const last = gathered.at(-1);

        if (isABlock(node)) {
          return [...gathered, node];
        }

        return Array.isArray(last)
          ? [...gathered.slice(0, -1), [...last, node]]
          : [...gathered, [node]];
      }, [])
      .map((group, at) =>
        Array.isArray(group) ? drawParagraph(group, at, look, isKept) : drawBlock(group, at),
      );

  /**
   * Draws one block.
   *
   * @param node - The block.
   * @param key - Where it is among its neighbours.
   * @returns It, drawn.
   */
  const drawBlock = (node: BookNode, key: number): ReactNode => {
    if (node.kind === 'text') {
      return null;
    }

    if (node.tag === 'hr') {
      return <View key={key} style={[styles.rule, { backgroundColor: ink }]} />;
    }

    if (node.tag === 'img') {
      const address = node.attributes['src'];
      const wide = Number(node.attributes['width']);
      const tall = Number(node.attributes['height']);

      return address === undefined ? null : (
        <ABookPicture
          key={key}
          address={onThisServer(address)}
          label={node.attributes['alt'] ?? null}
          ratio={wide > 0 && tall > 0 ? wide / tall : null}
        />
      );
    }

    const isIndented = node.tag === 'blockquote' || node.tag === 'ul' || node.tag === 'ol';

    return (
      <View key={key} style={isIndented ? styles.indented : styles.block}>
        {drawAll(node.children, headingLook(node.tag), node.tag === 'pre')}
      </View>
    );
  };

  return (
    <View style={styles.block}>
      {nodes.some((node) => namesIn(node).length > 0)
        ? nodes.map((node, at) => (
            <View
              key={at}
              onLayout={({ nativeEvent }) => {
                noteAnchors(node, nativeEvent.layout.y);
              }}
            >
              {drawAll([node], undefined, false)}
            </View>
          ))
        : drawAll(nodes, undefined, false)}
    </View>
  );
};

const TheBookText = memo(TheBookTextDrawn);

TheBookText.displayName = 'TheBookText';

export { TheBookText };
