import { describe, expect, it } from 'vitest';
import { htmlMarkup } from './htmlMarkup';

describe('htmlMarkup', () => {
  it('escapes what HTML would read as markup', () => {
    expect(htmlMarkup.escape('Tom & Jerry <3')).toBe('Tom &amp; Jerry &lt;3');
  });

  it('marks text bold', () => {
    expect(htmlMarkup.bold('Status:')).toBe('<b>Status:</b>');
  });

  it('sets text as code, escaping it first', () => {
    expect(htmlMarkup.code('A.Release<x>')).toBe('<code>A.Release&lt;x&gt;</code>');
  });

  it('quotes text', () => {
    expect(htmlMarkup.quote('the tunnel closed')).toBe(
      '<blockquote>the tunnel closed</blockquote>',
    );
  });

  it('links a label to an address, escaping the address', () => {
    expect(htmlMarkup.link('How to fix it', 'https://docs.getvalence.app/a?b=1&c="2"')).toBe(
      '<a href="https://docs.getvalence.app/a?b=1&amp;c=&quot;2&quot;">How to fix it</a>',
    );
  });

  it('writes a line of a list with a bullet', () => {
    expect(htmlMarkup.bullet('One')).toBe('• One');
  });
});
