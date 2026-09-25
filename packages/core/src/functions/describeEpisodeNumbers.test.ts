import { describe, expect, it } from 'vitest';
import { describeEpisodeNumbers } from './describeEpisodeNumbers';

describe('describeEpisodeNumbers', () => {
  it('says a single episode by its number', () => {
    expect(describeEpisodeNumbers(2)).toBe('2');
    expect(describeEpisodeNumbers(2, null)).toBe('2');
  });

  it('says a double episode as the run it covers', () => {
    expect(describeEpisodeNumbers(2, 3)).toBe('2–3');
  });
});
