import { describe, expect, it } from 'vitest';
import { PlainTextSchema } from './PlainTextSchema';

describe('PlainTextSchema', () => {
  it('accepts ordinary text, markup characters and all, since it is never read as markup', () => {
    expect(PlainTextSchema(100).safeParse('Tom & Jerry <3 — “quoted”').success).toBe(true);
  });

  it('refuses text past its length', () => {
    expect(PlainTextSchema(3).safeParse('four').success).toBe(false);
  });

  it.each(['\u0000', '\u0007', '\u001b[31m', '‮', '⁦', '\u007f'])(
    'refuses a control or override character %#',
    (character) => {
      expect(PlainTextSchema(100).safeParse(`safe${character}text`).success).toBe(false);
    },
  );

  it('allows line breaks and tabs', () => {
    expect(PlainTextSchema(100).safeParse('one\ntwo\tthree').success).toBe(true);
  });
});
