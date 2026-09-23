import { describe, expect, it } from 'vitest';
import { whereAnEntryLands } from './whereAnEntryLands';

const ENTRIES = ['a', 'b', 'c', 'd'];

describe('whereAnEntryLands', () => {
  it('lands one moved up a place after the one two above it', () => {
    expect(whereAnEntryLands(ENTRIES, 2, 1)).toBe('a');
  });

  it('lands one moved to the top after nothing', () => {
    expect(whereAnEntryLands(ENTRIES, 1, 0)).toBeNull();
  });

  it('lands one moved down a place after the one below it', () => {
    expect(whereAnEntryLands(ENTRIES, 1, 2)).toBe('c');
  });

  it('lands one dragged further down after the one it was dropped on', () => {
    expect(whereAnEntryLands(ENTRIES, 0, 3)).toBe('d');
  });
});
