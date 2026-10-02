import { describe, expect, it } from 'vitest';
import { libraryNameFor } from './libraryNameFor';

describe('libraryNameFor', () => {
  it('keeps the name of a library with one folder, and numbers one with several', () => {
    expect(libraryNameFor('Shows', 0, 1)).toBe('Shows');
    expect(libraryNameFor('Shows', 1, 2)).toBe('Shows 2');
  });
});
