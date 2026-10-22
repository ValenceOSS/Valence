import { describe, expect, it } from 'vitest';
import { artworkRevisionOf } from './artworkRevisionOf';

describe('artworkRevisionOf', () => {
  it('sends when the pictures last changed', () => {
    expect(artworkRevisionOf(new Date('2026-10-22T00:00:00.000Z'))).toEqual({
      artworkRevision: Date.parse('2026-10-22T00:00:00.000Z'),
    });
  });

  it('sends nothing for pictures that never changed', () => {
    expect(artworkRevisionOf(null)).toEqual({});
  });
});
