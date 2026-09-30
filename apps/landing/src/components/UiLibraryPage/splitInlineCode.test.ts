import { describe, expect, it } from 'vitest';
import { splitInlineCode } from './splitInlineCode';

describe('splitInlineCode', () => {
  it('marks the words between backticks as code', () => {
    expect(splitInlineCode('The one place a `<button>` is written.')).toEqual([
      { text: 'The one place a ', isCode: false },
      { text: '<button>', isCode: true },
      { text: ' is written.', isCode: false },
    ]);
  });

  it('leaves prose without backticks as one run', () => {
    expect(splitInlineCode('A small label.')).toEqual([{ text: 'A small label.', isCode: false }]);
  });

  it('keeps an unclosed backtick as text', () => {
    expect(splitInlineCode('Half `open')).toEqual([{ text: 'Half `open', isCode: false }]);
  });
});
