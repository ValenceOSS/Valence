import { describe, expect, it } from 'vitest';
import { isStyledSubtitle } from './isStyledSubtitle';

describe('isStyledSubtitle', () => {
  it('knows both kinds of script, however the format is spelt', () => {
    expect(isStyledSubtitle('ass')).toBe(true);
    expect(isStyledSubtitle('SSA')).toBe(true);
  });

  it('knows that a plain track has no styling to ask for', () => {
    expect(isStyledSubtitle('srt')).toBe(false);
    expect(isStyledSubtitle('webvtt')).toBe(false);
    expect(isStyledSubtitle('ocr')).toBe(false);
    expect(isStyledSubtitle('pgs')).toBe(false);
  });
});
