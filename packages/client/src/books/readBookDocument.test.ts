import { describe, expect, it } from 'vitest';
import { readBookDocument } from './readBookDocument';

describe('readBookDocument', () => {
  it('reads nested elements and their text in order', () => {
    expect(readBookDocument('<p>It was <em>cold</em>.</p>')).toEqual([
      {
        kind: 'element',
        tag: 'p',
        attributes: {},
        children: [
          { kind: 'text', text: 'It was ' },
          {
            kind: 'element',
            tag: 'em',
            attributes: {},
            children: [{ kind: 'text', text: 'cold' }],
          },
          { kind: 'text', text: '.' },
        ],
      },
    ]);
  });

  it('reads attributes, however they are quoted', () => {
    const [picture, link] = readBookDocument(
      '<img src="/api/books/1/resource?href=a.png" alt=\'A map\'><a href=#valence-part-2:x>on</a>',
    );

    expect(picture).toEqual({
      kind: 'element',
      tag: 'img',
      attributes: { src: '/api/books/1/resource?href=a.png', alt: 'A map' },
      children: [],
    });
    expect(link).toMatchObject({ tag: 'a', attributes: { href: '#valence-part-2:x' } });
  });

  it('turns character references back into characters', () => {
    expect(readBookDocument('<p>Fish &amp; chips &#8212; &#x2019;tis&nbsp;so</p>')).toEqual([
      {
        kind: 'element',
        tag: 'p',
        attributes: {},
        children: [{ kind: 'text', text: 'Fish & chips — ’tis so' }],
      },
    ]);
  });

  it('keeps empty tags empty rather than holding what follows', () => {
    const [line] = readBookDocument('<p>one<br>two</p>');

    expect(line).toMatchObject({
      children: [
        { kind: 'text', text: 'one' },
        { kind: 'element', tag: 'br' },
        { kind: 'text', text: 'two' },
      ],
    });
  });

  it('forgives a tag left open and one closed that never opened', () => {
    expect(readBookDocument('<div><p>left open</div></span>after')).toEqual([
      {
        kind: 'element',
        tag: 'div',
        attributes: {},
        children: [
          {
            kind: 'element',
            tag: 'p',
            attributes: {},
            children: [{ kind: 'text', text: 'left open' }],
          },
        ],
      },
      { kind: 'text', text: 'after' },
    ]);
  });

  it('drops comments', () => {
    expect(readBookDocument('<!-- a note --><p>kept</p>')).toHaveLength(1);
  });
});
