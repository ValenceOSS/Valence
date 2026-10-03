import { describe, expect, it } from 'vitest';
import { isWebAddress } from './isWebAddress';

describe('isWebAddress', () => {
  it('takes an address on the web, secure or not', () => {
    expect(isWebAddress('https://sonarr.local:8989')).toBe(true);
    expect(isWebAddress('http://192.168.1.4:7878/radarr')).toBe(true);
  });

  it('refuses what is not an address at all', () => {
    expect(isWebAddress('sonarr.local')).toBe(false);
    expect(isWebAddress('')).toBe(false);
  });

  it('refuses an address that is not reached over the web', () => {
    expect(isWebAddress('ftp://files.local')).toBe(false);
    expect(isWebAddress('javascript:alert(1)')).toBe(false);
  });
});
