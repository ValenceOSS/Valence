import { describe, expect, it } from 'vitest';
import { qualityStepOf } from './qualityStepOf';

describe('qualityStepOf', () => {
  it('reads a scope film by its width, as a person would', () => {
    expect(qualityStepOf({ width: 1920, height: 800 })?.label).toBe('1080p');
    expect(qualityStepOf({ width: 3840, height: 1600 })?.label).toBe('4K');
  });

  it('reads a narrow picture by its height', () => {
    expect(qualityStepOf({ width: 1440, height: 1080 })?.label).toBe('1080p');
  });

  it('is nothing for a picture smaller than every step', () => {
    expect(qualityStepOf({ width: 100, height: 80 })).toBeUndefined();
  });
});
