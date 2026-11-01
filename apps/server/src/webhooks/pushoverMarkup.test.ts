import { describe, expect, it } from 'vitest';
import { pushoverMarkup } from './pushoverMarkup';

describe('pushoverMarkup', () => {
  it('escapes what HTML would read as markup', () => {
    expect(pushoverMarkup.escape('Tom & Jerry <3')).toBe('Tom &amp; Jerry &lt;3');
  });

  it('marks text bold', () => {
    expect(pushoverMarkup.bold('Status:')).toBe('<b>Status:</b>');
  });

  it('writes code as plain text, since Pushover has no code', () => {
    expect(pushoverMarkup.code('A.Release<x>')).toBe('A.Release&lt;x&gt;');
  });

  it('quotes text in italics, since Pushover has no quotes', () => {
    expect(pushoverMarkup.quote('the tunnel closed')).toBe('<i>the tunnel closed</i>');
  });

  it('links a label to an address, escaping the address', () => {
    expect(pushoverMarkup.link('How to fix it', 'https://docs.getvalence.app/a?b=1&c=2')).toBe(
      '<a href="https://docs.getvalence.app/a?b=1&amp;c=2">How to fix it</a>',
    );
  });

  it('writes a line of a list with a bullet', () => {
    expect(pushoverMarkup.bullet('One')).toBe('• One');
  });
});
