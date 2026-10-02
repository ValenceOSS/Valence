import { describe, expect, it } from 'vitest';
import { sameAddress } from './sameAddress';

describe('sameAddress', () => {
  it('ignores the case of the host and a trailing slash', () => {
    expect(sameAddress('http://Radarr:7878/', 'http://radarr:7878')).toBe(true);
    expect(sameAddress('http://radarr:7878/radarr/', 'http://radarr:7878/radarr')).toBe(true);
  });

  it('tells apart different ports, paths and schemes', () => {
    expect(sameAddress('http://radarr:7878', 'http://radarr:7879')).toBe(false);
    expect(sameAddress('http://radarr:7878/a', 'http://radarr:7878/b')).toBe(false);
    expect(sameAddress('https://radarr:7878', 'http://radarr:7878')).toBe(false);
  });

  it('compares what is not an address as text', () => {
    expect(sameAddress('not an address/', 'NOT AN ADDRESS')).toBe(true);
  });
});
