import { describe, expect, it } from 'vitest';
import { tagsOf } from './tagsOf';

describe('tagsOf', () => {
  it('reads each tag in order, opening and closing, with its attributes', () => {
    expect(
      [...tagsOf('<nav epub:type="toc"><ol><a href="one.xhtml">One</a></ol></nav>')].map(
        ({ name, isClosing, attributes }) => ({ name, isClosing, attributes }),
      ),
    ).toEqual([
      { name: 'nav', isClosing: false, attributes: ' epub:type="toc"' },
      { name: 'ol', isClosing: false, attributes: '' },
      { name: 'a', isClosing: false, attributes: ' href="one.xhtml"' },
      { name: 'a', isClosing: true, attributes: '' },
      { name: 'ol', isClosing: true, attributes: '' },
      { name: 'nav', isClosing: true, attributes: '' },
    ]);
  });

  it('says where a tag starts and where the text after it begins', () => {
    const [first] = tagsOf('ab<b>cd');

    expect(first).toMatchObject({ starts: 2, ends: 5 });
  });

  it('passes over a tag that is opened and never closed, and reads the one after it', () => {
    expect([...tagsOf('<a href="x" <b>')].map((tag) => tag.name)).toEqual(['b']);
  });

  it('reads a document made of unclosed tags in moments', () => {
    const began = Date.now();

    expect([...tagsOf(`${'<a href="x" '.repeat(200_000)}`)]).toEqual([]);
    expect(Date.now() - began).toBeLessThan(1000);
  });
});
