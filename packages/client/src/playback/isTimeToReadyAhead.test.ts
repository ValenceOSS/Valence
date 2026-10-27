import { describe, expect, it } from 'vitest';
import { isTimeToReadyAhead } from './isTimeToReadyAhead';

describe('isTimeToReadyAhead', () => {
  it('waits until the last stretch of an episode', () => {
    expect(isTimeToReadyAhead(600, 1500)).toBe(false);
  });

  it('makes the next one ready in the last stretch', () => {
    expect(isTimeToReadyAhead(1460, 1500)).toBe(true);
  });

  it('makes nothing ready once the episode has ended', () => {
    expect(isTimeToReadyAhead(1500, 1500)).toBe(false);
  });

  it('makes nothing ready for something too short to have a last stretch', () => {
    expect(isTimeToReadyAhead(50, 60)).toBe(false);
  });
});
