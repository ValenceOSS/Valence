import { createElement, useMemo } from 'react';
import { BOOK_DOCUMENT_TAGS, bookPlaceIn } from '@ValenceContracts/schemas/Book';
import type { ReactNode } from 'react';
import type { BookTextProps } from './BookText.types';

const ALLOWED: ReadonlySet<string> = new Set(BOOK_DOCUMENT_TAGS);

const EMPTY: ReadonlySet<string> = new Set(['br', 'hr', 'img']);

/**
 * Builds the React elements for one node of a part of a book.
 *
 * Only what a book may contain is built: an element of any other kind is left out and its text kept,
 * and of its attributes only the handful that say what a thing is — never an event handler or a
 * style. A picture must be one this server serves, and a link either stays in the book, where it
 * moves the reader, or leaves for the web, where it opens somewhere else.
 *
 * @param node - The node.
 * @param key - Its key among its siblings.
 * @param onFollow - Told when a link within the book is followed.
 * @returns What to draw for it.
 */
const build = (node: Node, key: number, onFollow: BookTextProps['onFollow']): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (!(node instanceof Element)) {
    return null;
  }

  const tag = node.tagName.toLowerCase();
  const children = [...node.childNodes].map((child, at) => build(child, at, onFollow));

  if (!ALLOWED.has(tag)) {
    return createElement('span', { key }, ...children);
  }

  const props = {
    key,
    id: node.getAttribute('id') ?? undefined,
    lang: node.getAttribute('lang') ?? undefined,
    dir: node.getAttribute('dir') ?? undefined,
    title: node.getAttribute('title') ?? undefined,
  };

  if (tag === 'img') {
    const src = node.getAttribute('src') ?? '';

    if (!src.startsWith('/api/books/')) {
      return null;
    }

    return createElement('img', {
      ...props,
      src,
      alt: node.getAttribute('alt') ?? '',
      decoding: 'async',
    });
  }

  if (tag === 'a') {
    const href = node.getAttribute('href');
    const place = href === null ? null : bookPlaceIn(href);

    if (href !== null && place !== null) {
      return createElement(
        'a',
        {
          ...props,
          href,
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            onFollow(place);
          },
        },
        ...children,
      );
    }

    if (href !== null && /^(https?:|mailto:)/i.test(href)) {
      return createElement(
        'a',
        // eslint-disable-next-line valence/no-hard-coded-strings -- a link's rel tokens, not words
        { ...props, href, target: '_blank', rel: 'noreferrer noopener' },
        ...children,
      );
    }

    return createElement('span', props, ...children);
  }

  return EMPTY.has(tag) ? createElement(tag, props) : createElement(tag, props, ...children);
};

/**
 * One part of a book, drawn from the text the server has already cleaned.
 *
 * The HTML is read into a document that is never attached to the page and rebuilt as elements
 * React owns, rather than handed to the browser to parse into the page: nothing a book says is
 * ever run, and what is drawn is only what this knows how to draw. The server cleaned it first, so
 * this is the second of two locks rather than the only one.
 *
 * @param html - The part, as the server sent it.
 * @param onFollow - Told when a link to another place in the book is followed.
 */
const BookText = ({ html, onFollow }: BookTextProps) => {
  const built = useMemo(() => {
    const body = new DOMParser().parseFromString(html, 'text/html').body;

    return [...body.childNodes].map((node, at) => build(node, at, onFollow));
  }, [html, onFollow]);

  return <>{built}</>;
};

BookText.displayName = 'BookText';

export { BookText };
