import { describe, expect, it } from 'vitest';
import { nameTheSystem } from './nameTheSystem';

describe('nameTheSystem', () => {
  it('writes each system’s name as its maker does', () => {
    expect(nameTheSystem('ios')).toBe('iOS');
    expect(nameTheSystem('macos')).toBe('macOS');
    expect(nameTheSystem('chromeos')).toBe('ChromeOS');
    expect(nameTheSystem('androidTv')).toBe('Android TV');
    expect(nameTheSystem('fireOs')).toBe('Fire OS');
  });
});
