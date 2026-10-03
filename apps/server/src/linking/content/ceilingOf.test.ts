import { describe, expect, it } from 'vitest';
import { ceilingOf } from './ceilingOf';

describe('ceilingOf', () => {
  it('plays what was asked for where it is within the ceiling', () => {
    expect(ceilingOf('720p', '1080p')).toBe('720p');
    expect(ceilingOf('1080p', '1080p')).toBe('1080p');
  });

  it('plays at the ceiling where more was asked for, or nothing was', () => {
    expect(ceilingOf('2160p', '1080p')).toBe('1080p');
    expect(ceilingOf(undefined, '1080p')).toBe('1080p');
  });
});
