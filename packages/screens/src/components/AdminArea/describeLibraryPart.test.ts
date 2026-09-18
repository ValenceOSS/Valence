import { describe, expect, it } from 'vitest';
import { LIBRARY_PARTS } from '@ValenceContracts/schemas/LibraryPart';
import { describeLibraryPart } from './describeLibraryPart';

describe('describeLibraryPart', () => {
  it('names every part, and says what it holds', () => {
    for (const part of LIBRARY_PARTS) {
      expect(describeLibraryPart(part).label).not.toBe('');
      expect(describeLibraryPart(part).description).not.toBe('');
    }
  });

  it('says trailers are the catalogue’s, not trailer files on disk', () => {
    expect(describeLibraryPart('trailers').description).toMatch(/not trailer files/);
  });

  it('warns that age-limited profiles treat a title as unrated meanwhile', () => {
    expect(describeLibraryPart('ageRatings').description).toMatch(/unrated/);
  });
});
