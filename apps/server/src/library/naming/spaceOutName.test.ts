import { describe, expect, it } from 'vitest';
import { spaceOutName } from './spaceOutName';

describe('spaceOutName', () => {
  it('puts spaces between the words of a dotted name', () => {
    expect(spaceOutName('Harry.Potter.and.the.Chamber')).toBe('Harry Potter and the Chamber');
  });

  it('leaves initials alone', () => {
    expect(spaceOutName('S.H.I.E.L.D')).toBe('S.H.I.E.L.D');
  });
});
