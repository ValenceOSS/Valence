import { describe, expect, it } from 'vitest';
import { isAppClient } from './isAppClient';

describe('isAppClient', () => {
  it('knows an app outside Valence from a Valence client', () => {
    expect(isAppClient('app~pw1')).toBe(true);
    expect(isAppClient('9b2f0c1e-web')).toBe(false);
  });
});
