import { describe, expect, it } from 'vitest';
import { describePlaybackRate } from './describePlaybackRate';

describe('describePlaybackRate', () => {
  it('calls the speed it was made at normal', () => {
    expect(describePlaybackRate(1)).toBe('Normal');
  });

  it('names any other speed by how many times faster', () => {
    expect(describePlaybackRate(1.5)).toBe('1.5x');
  });
});
