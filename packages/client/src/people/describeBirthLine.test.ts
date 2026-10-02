import { describe, expect, it } from 'vitest';
import { describeBirthLine } from './describeBirthLine';

describe('describeBirthLine', () => {
  it('says when and where somebody was born', () => {
    expect(describeBirthLine({ bornOn: '1974-08-19', bornIn: 'Hope, Arkansas' })).toMatch(
      /^Born .*1974 · Hope, Arkansas$/u,
    );
  });

  it('says only what is known', () => {
    expect(describeBirthLine({ bornOn: null, bornIn: 'Hope, Arkansas' })).toBe('Hope, Arkansas');
    expect(describeBirthLine({ bornOn: null, bornIn: null })).toBeNull();
  });
});
