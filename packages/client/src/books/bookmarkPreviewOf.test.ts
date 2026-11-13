import { describe, expect, it } from 'vitest';
import { bookmarkPreviewOf } from './bookmarkPreviewOf';
import type { TypesetBlock } from '@ValenceContracts/schemas/BookText';

const PICTURE = (href: string) =>
  `<div><img src="/api/books/b/chapters/c/resource?href=${encodeURIComponent(href)}" alt="" /></div>`;

/**
 * A paragraph as a typesetter sets it.
 */
const aParagraph = (text: string): TypesetBlock => ({
  kind: 'paragraph',
  runs: [{ text, isItalic: false, isBold: false }],
  anchors: [],
});

describe('bookmarkPreviewOf', () => {
  it('takes the words at the start of a part', () => {
    expect(bookmarkPreviewOf('<p>It is a truth universally acknowledged.</p>', 0)).toEqual({
      excerpt: 'It is a truth universally acknowledged.',
      picture: null,
    });
  });

  it('starts the words at the beginning of the word the place falls in', () => {
    const preview = bookmarkPreviewOf('<p>aaaa bbbb cccc dddd</p>', 0.3);

    expect(preview.excerpt).toBe('bbbb cccc dddd');
  });

  it('carries on into the paragraphs after, with their spacing tidied', () => {
    expect(
      bookmarkPreviewOf([aParagraph('First   line.'), aParagraph('  Second\tline. ')], 0).excerpt,
    ).toBe('First line. Second line.');
  });

  it('cuts a long excerpt at a space, and says it was cut', () => {
    const words = Array.from({ length: 60 }, (_, at) => `word${at.toString()}`).join(' ');
    const excerpt = bookmarkPreviewOf(`<p>${words}</p>`, 0).excerpt ?? '';

    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(121);
    expect(words.startsWith(excerpt.slice(0, -1))).toBe(true);
    expect(words.charAt(excerpt.length - 1)).toBe(' ');
  });

  it('takes the picture in a part made of one picture, wherever in it the place is', () => {
    for (const within of [0, 0.5, 1]) {
      expect(bookmarkPreviewOf(PICTURE('OEBPS/images/p 2.png'), within)).toEqual({
        excerpt: null,
        picture: 'OEBPS/images/p 2.png',
      });
    }
  });

  it('weighs a picture as about a page of words when finding the place', () => {
    const part = `<p>${'a '.repeat(300)}</p>${PICTURE('one.png')}<p>After the picture.</p>`;

    expect(bookmarkPreviewOf(part, 0.1).picture).toBeNull();
    expect(bookmarkPreviewOf(part, 0.7)).toEqual({ excerpt: null, picture: 'one.png' });
    expect(bookmarkPreviewOf(part, 0.999).excerpt).toBe('picture.');
  });

  it('takes the words after a picture, without the picture, when the place is in them', () => {
    const part = `<p>Before.</p>${PICTURE('one.png')}<p>After.</p>`;

    expect(bookmarkPreviewOf(part, 0).excerpt).toBe('Before. After.');
  });

  it('shows nothing for a part with nothing in it', () => {
    expect(bookmarkPreviewOf('', 0.5)).toEqual({ excerpt: null, picture: null });
    expect(bookmarkPreviewOf([], 0.5)).toEqual({ excerpt: null, picture: null });
  });

  it('shows the last thing in the part for a place at its very end', () => {
    expect(bookmarkPreviewOf('<p>One two three.</p>', 1).excerpt).toBe('three.');
  });

  it('shows no picture whose address it cannot read back', () => {
    const blocks: TypesetBlock[] = [
      {
        kind: 'picture',
        runs: [],
        anchors: [],
        picture: { address: 'https://elsewhere.example/p.png', width: null, height: null },
      },
    ];
    const broken: TypesetBlock[] = [
      {
        kind: 'picture',
        runs: [],
        anchors: [],
        picture: { address: '/resource?href=%E0%A4%A', width: null, height: null },
      },
    ];

    expect(bookmarkPreviewOf(blocks, 0)).toEqual({ excerpt: null, picture: null });
    expect(bookmarkPreviewOf(broken, 0)).toEqual({ excerpt: null, picture: null });
  });

  it('shows no picture whose address is longer than a bookmark keeps', () => {
    expect(bookmarkPreviewOf(PICTURE('a'.repeat(1100)), 0).picture).toBeNull();
  });
});
