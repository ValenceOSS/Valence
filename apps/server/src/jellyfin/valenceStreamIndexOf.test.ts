import { describe, expect, it } from 'vitest';
import { valenceStreamIndexOf } from './valenceStreamIndexOf';

describe('valenceStreamIndexOf', () => {
  it('reads nothing, the picture, and Jellyfin’s “none” as no choice', () => {
    expect(valenceStreamIndexOf(undefined)).toBeUndefined();
    expect(valenceStreamIndexOf(0)).toBeUndefined();
    expect(valenceStreamIndexOf(-1)).toBeUndefined();
  });

  it('reads a stream as Valence’s index', () => {
    expect(valenceStreamIndexOf(2)).toBe(1);
  });
});
