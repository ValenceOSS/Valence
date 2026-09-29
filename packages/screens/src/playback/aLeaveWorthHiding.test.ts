import { describe, expect, it } from 'vitest';
import { aLeaveWorthHiding } from './aLeaveWorthHiding';

describe('a pointer leaving the picture', () => {
  it('means the viewer has gone when it is a mouse', () => {
    expect(aLeaveWorthHiding('mouse')).toBe(true);
  });

  it('means only that a finger lifted, which happens after every tap', () => {
    expect(aLeaveWorthHiding('touch')).toBe(false);
  });

  it('means nothing for a pen either, which is put down the same way', () => {
    expect(aLeaveWorthHiding('pen')).toBe(false);
  });

  it('says nothing where a browser reports no kind at all', () => {
    expect(aLeaveWorthHiding('')).toBe(false);
  });
});
