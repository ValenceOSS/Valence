import { describe, expect, it } from 'vitest';
import { loginFrom } from './loginFrom';

describe('loginFrom', () => {
  it('makes a plain login from a name, accents and all', () => {
    expect(loginFrom('Sam Smith')).toBe('sam-smith');
    expect(loginFrom('Zoë  O’Brien!')).toBe('zoe-o-brien');
  });

  it('makes nothing from a name with no letters or digits to use', () => {
    expect(loginFrom('🎬🎬')).toBe('');
  });
});
