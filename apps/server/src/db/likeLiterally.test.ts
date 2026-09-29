import { describe, expect, it } from 'vitest';
import { likeLiterally } from './likeLiterally';

describe('likeLiterally', () => {
  it('escapes what LIKE would read as a pattern', () => {
    expect(likeLiterally('50%_off\\now')).toBe('50\\%\\_off\\\\now');
  });

  it('leaves ordinary text alone', () => {
    expect(likeLiterally('Spirited Away')).toBe('Spirited Away');
  });
});
