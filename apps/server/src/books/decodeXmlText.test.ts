import { describe, expect, it } from 'vitest';
import { decodeXmlText } from './decodeXmlText';

describe('decodeXmlText', () => {
  it('spells out the named entities', () => {
    expect(decodeXmlText('Pride &amp; Prejudice &hellip;')).toBe('Pride & Prejudice …');
  });

  it('drops a tag that was escaped, as a description escaped twice over carries', () => {
    expect(decodeXmlText('&lt;p&gt;Pride &amp;amp; Prejudice&lt;/p&gt;')).toBe('Pride & Prejudice');
  });

  it('spells out entities written as numbers', () => {
    expect(decodeXmlText('It&#8217;s &#x2014; true')).toBe('It’s — true');
  });

  it('leaves an entity it does not know as it was', () => {
    expect(decodeXmlText('&notarealentity;')).toBe('&notarealentity;');
  });

  it('drops tags inside the text', () => {
    expect(decodeXmlText('<span>Chapter</span> <em>One</em>')).toBe('Chapter One');
  });

  it('makes runs of whitespace single spaces', () => {
    expect(decodeXmlText('\n   Chapter\n\t  One  ')).toBe('Chapter One');
  });
});
