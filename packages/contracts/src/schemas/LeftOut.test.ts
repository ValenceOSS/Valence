import { describe, expect, it } from 'vitest';
import { LeaveOutRequestSchema, LeftOutSchema, MOST_NOTE_CHARACTERS } from './LeftOut';

describe('LeftOut', () => {
  it('reads a file or folder left out of a library, with why and who', () => {
    const read = LeftOutSchema.parse({
      id: 'left-1',
      libraryId: 'library-1',
      path: '/media/films/Broken (2019).mkv',
      isFolder: false,
      note: 'Corrupted after the first hour',
      createdAt: '2026-10-03T12:00:00.000Z',
      createdBy: 'account-1',
    });

    expect(read.note).toBe('Corrupted after the first hour');
  });

  it('asks for a path, and takes a note only where one was written', () => {
    expect(LeaveOutRequestSchema.parse({ path: ' /media/films/Extras ' })).toEqual({
      path: '/media/films/Extras',
      note: null,
    });
    expect(LeaveOutRequestSchema.safeParse({ path: '  ' }).success).toBe(false);
  });

  it('keeps a note short enough to read in a list', () => {
    expect(
      LeaveOutRequestSchema.safeParse({ path: '/a', note: 'a'.repeat(MOST_NOTE_CHARACTERS + 1) })
        .success,
    ).toBe(false);
  });
});
