import { describe, expect, it } from 'vitest';
import { qualityUnderCeiling } from './qualityUnderCeiling';

describe('qualityUnderCeiling', () => {
  it('plays what was asked for where it is within the ceiling', () => {
    expect(qualityUnderCeiling('720p', '1080p')).toBe('720p');
    expect(qualityUnderCeiling('1080p', '1080p')).toBe('1080p');
  });

  it('plays at the ceiling where more was asked for, or nothing was', () => {
    expect(qualityUnderCeiling('2160p', '1080p')).toBe('1080p');
    expect(qualityUnderCeiling(undefined, '1080p')).toBe('1080p');
  });
});
