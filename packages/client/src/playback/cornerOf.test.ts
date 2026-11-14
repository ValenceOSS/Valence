import { describe, expect, it } from 'vitest';
import { cornerOf } from './cornerOf';

describe('the corner a keypad alignment names', () => {
  it('reads the bottom row as the keys along the bottom', () => {
    expect(cornerOf(1)).toEqual({ across: 'left', down: 'bottom' });
    expect(cornerOf(2)).toEqual({ across: 'centre', down: 'bottom' });
    expect(cornerOf(3)).toEqual({ across: 'right', down: 'bottom' });
  });

  it('reads the middle and top rows the same way', () => {
    expect(cornerOf(5)).toEqual({ across: 'centre', down: 'middle' });
    expect(cornerOf(7)).toEqual({ across: 'left', down: 'top' });
    expect(cornerOf(9)).toEqual({ across: 'right', down: 'top' });
  });

  it('takes an alignment outside the nine as the nearest of them', () => {
    expect(cornerOf(0)).toEqual({ across: 'left', down: 'bottom' });
    expect(cornerOf(42)).toEqual({ across: 'right', down: 'top' });
  });
});
