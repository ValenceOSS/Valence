import { describe, expect, it } from 'vitest';
import { sharpestStepOf } from './sharpestStepOf';

describe('sharpestStepOf', () => {
  it('counts a widescreen film as wide as 4K as 4K', () => {
    expect(sharpestStepOf({ width: 3840, height: 1600 })?.id).toBe('2160p');
  });

  it('counts a four-by-three film as tall as 1080p as 1080p', () => {
    expect(sharpestStepOf({ width: 1440, height: 1080 })?.id).toBe('1080p');
  });

  it('forgives an encode trimmed by a few pixels', () => {
    expect(sharpestStepOf({ width: 3832, height: 2076 })?.id).toBe('2160p');
  });

  it('finds nothing for a picture smaller than any step', () => {
    expect(sharpestStepOf({ width: 100, height: 60 })).toBeNull();
  });
});
