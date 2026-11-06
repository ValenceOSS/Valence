import { describe, expect, it } from 'vitest';
import { sameWord } from './sameWord';

describe('sameWord', () => {
  it('reads two spellings of one word alike', () => {
    expect(sameWord('Sci-Fi & Fantasy')).toBe(sameWord('sci fi and fantasy'));
    expect(sameWord('Drama')).not.toBe(sameWord('Dramas'));
  });
});
