import { describe, expect, it } from 'vitest';
import { decodeXmlText } from './decodeXmlText';

describe('decodeXmlText', () => {
  it('spells out the named entities', () => {
    expect(decodeXmlText('Pride &amp; Prejudice &lt;1813&gt;')).toBe('Pride & Prejudice <1813>');
  });

  it('spells out entities written as numbers', () => {
    expect(decodeXmlText('It&#8217;s &#x2014; true')).toBe('It’s — true');
  });

  it('leaves an entity it does not know as it was', () => {
    expect(decodeXmlText('&hellip;')).toBe('&hellip;');
  });

  it('drops tags inside the text', () => {
    expect(decodeXmlText('<span>Chapter</span> <em>One</em>')).toBe('Chapter One');
  });

  it('makes runs of whitespace single spaces', () => {
    expect(decodeXmlText('\n   Chapter\n\t  One  ')).toBe('Chapter One');
  });
});
