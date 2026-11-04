import { describe, expect, it } from 'vitest';
import { sharedOf } from './sharedOf';

describe('sharedOf', () => {
  it('says a value every file shares once', () => {
    expect(sharedOf(['HEVC', 'HEVC'], 'Mixed')).toBe('HEVC');
  });

  it('says they differ when they do', () => {
    expect(sharedOf(['HEVC', 'H264'], 'Mixed')).toBe('Mixed');
  });

  it('says nothing for no files', () => {
    expect(sharedOf([], 'Mixed')).toBeNull();
  });
});
