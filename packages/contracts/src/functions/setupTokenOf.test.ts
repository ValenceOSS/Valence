import { describe, expect, it } from 'vitest';
import { setupTokenOf } from './setupTokenOf';

describe('setupTokenOf', () => {
  it('reads the token from a setup link', () => {
    expect(setupTokenOf('https://valence.example/welcome/abc_DEF-123')).toBe('abc_DEF-123');
  });

  it('ignores anything after it', () => {
    expect(setupTokenOf('https://valence.example/welcome/abc?from=email')).toBe('abc');
  });

  it('finds nothing in an address that is not a setup link', () => {
    expect(setupTokenOf('https://valence.example/share/abc')).toBeNull();
    expect(setupTokenOf('https://valence.example/welcome/')).toBeNull();
  });
});
