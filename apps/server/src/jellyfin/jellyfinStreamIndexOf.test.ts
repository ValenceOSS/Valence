import { describe, expect, it } from 'vitest';
import { jellyfinStreamIndexOf } from './jellyfinStreamIndexOf';
import { valenceStreamIndexOf } from './valenceStreamIndexOf';

describe('jellyfinStreamIndexOf', () => {
  it('numbers a stream one past Valence’s, and turns back', () => {
    expect(jellyfinStreamIndexOf(0)).toBe(1);
    expect(valenceStreamIndexOf(jellyfinStreamIndexOf(3))).toBe(3);
  });
});
