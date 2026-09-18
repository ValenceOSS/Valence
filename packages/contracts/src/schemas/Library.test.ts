import { describe, expect, it } from 'vitest';
import { LIBRARY_KINDS, SELECTABLE_LIBRARY_KINDS, LibraryKindSchema } from './Library';

describe('SELECTABLE_LIBRARY_KINDS', () => {
  it('offers music, now that a scanner reads it', () => {
    expect([...SELECTABLE_LIBRARY_KINDS]).toContain('music');
  });

  it('offers every kind that something does read', () => {
    expect([...SELECTABLE_LIBRARY_KINDS]).toEqual([...LIBRARY_KINDS]);
  });

  it('reads a music library back', () => {
    expect(LibraryKindSchema.parse('music')).toBe('music');
  });
});
