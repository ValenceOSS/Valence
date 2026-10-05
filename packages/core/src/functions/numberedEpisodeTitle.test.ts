import { describe, expect, it } from 'vitest';
import { numberedEpisodeTitle } from './numberedEpisodeTitle';

describe('numberedEpisodeTitle', () => {
  it('puts the number before the name', () => {
    expect(numberedEpisodeTitle('Pilot', 1)).toBe('1. Pilot');
  });

  it('names the numbers a double episode covers', () => {
    expect(numberedEpisodeTitle('The Finale', 9, 10)).toBe(`9–10. The Finale`);
  });

  it('is just the name where there is no number', () => {
    expect(numberedEpisodeTitle('Special', null)).toBe('Special');
  });
});
