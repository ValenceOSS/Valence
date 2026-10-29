import { describe, expect, it } from 'vitest';
import { nameOfAccel } from './nameOfAccel';

describe('nameOfAccel', () => {
  it('names a backend the way the setting does', () => {
    expect(nameOfAccel('nvenc')).toBe('NVENC');
    expect(nameOfAccel('videotoolbox')).toBe('VideoToolbox');
  });

  it('writes a backend it does not know in capitals', () => {
    expect(nameOfAccel('vulkan')).toBe('VULKAN');
  });
});
