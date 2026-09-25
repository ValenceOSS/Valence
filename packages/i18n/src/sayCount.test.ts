import { describe, expect, it } from 'vitest';
import { sayCount } from './sayCount';

describe('sayCount', () => {
  it('says one of something in the singular', () => {
    expect(sayCount('common.episodesLeft', 1)).toBe('1 episode left');
  });

  it('says none or several in the plural', () => {
    expect(sayCount('common.episodesLeft', 0)).toBe('0 episodes left');
    expect(sayCount('common.episodesLeft', 2)).toBe('2 episodes left');
  });

  it('writes a large count with its thousands marked', () => {
    expect(sayCount('common.episodesLeft', 1200)).toBe('1,200 episodes left');
  });
});
