import { describe, expect, it } from 'vitest';
import { howItLinesUp } from './howItLinesUp';

describe('howItLinesUp', () => {
  it('keeps a line in the left column to the left, words and all', () => {
    expect(howItLinesUp('left')).toEqual({ alignSelf: 'flex-start', textAlign: 'left' });
  });

  it('centres a line in the middle column', () => {
    expect(howItLinesUp('centre')).toEqual({ alignSelf: 'center', textAlign: 'center' });
  });

  it('keeps a line in the right column to the right, words and all', () => {
    expect(howItLinesUp('right')).toEqual({ alignSelf: 'flex-end', textAlign: 'right' });
  });
});
