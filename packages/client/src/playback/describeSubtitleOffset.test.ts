import { describe, expect, it } from 'vitest';
import { describeSubtitleOffset } from './describeSubtitleOffset';

describe('describeSubtitleOffset', () => {
  it('says subtitles that have not been moved are in time', () => {
    expect(describeSubtitleOffset(0)).toBe('In time');
  });

  it('signs a nudge later', () => {
    expect(describeSubtitleOffset(0.25)).toBe('+0.25s');
  });

  it('signs a nudge earlier', () => {
    expect(describeSubtitleOffset(-0.5)).toBe('-0.50s');
  });
});
