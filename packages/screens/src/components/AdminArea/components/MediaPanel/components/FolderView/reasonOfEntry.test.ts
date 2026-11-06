import { describe, expect, it } from 'vitest';
import { reasonOfEntry } from './reasonOfEntry';
import type { LibraryEntry } from '@ValenceContracts/schemas/LibraryFiles';

const A_FILE: LibraryEntry = {
  name: 'Film.mkv',
  path: '/media/films/Film.mkv',
  isFolder: false,
  sizeBytes: 1,
  modifiedAt: null,
  mediaId: null,
};

describe('reasonOfEntry', () => {
  it('says what the last scan said of a file, where it said something', () => {
    expect(
      reasonOfEntry({
        ...A_FILE,
        status: 'unreadable',
        reason: { code: 'x', message: 'No video stream', values: {} },
      }),
    ).toBe('No video stream');
  });

  it('says what keeps a video out of the library', () => {
    expect(reasonOfEntry({ ...A_FILE, status: 'sample' })).toBe(
      'It looks like a sample, which scans skip.',
    );
    expect(reasonOfEntry({ ...A_FILE, status: 'notReadYet' })).toBe(
      'The library hasn’t read it yet. It’s added at the next scan.',
    );
  });

  it('says nothing of what is in the library', () => {
    expect(reasonOfEntry({ ...A_FILE, status: 'inLibrary' })).toBeNull();
    expect(reasonOfEntry(A_FILE)).toBeNull();
  });
});
