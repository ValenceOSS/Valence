import { describe, expect, it } from 'vitest';
import { sayCount } from './sayCount';

describe('sayCount', () => {
  it('says one of something in the form for one', () => {
    expect(sayCount('common.count.episodes', 1)).toBe('1 episode');
  });

  it('says several in the form for several, with the number grouped', () => {
    expect(sayCount('common.count.episodes', 1200)).toBe('1,200 episodes');
  });

  it('says none in the form for several', () => {
    expect(sayCount('common.count.episodes', 0)).toBe('0 episodes');
  });
});
