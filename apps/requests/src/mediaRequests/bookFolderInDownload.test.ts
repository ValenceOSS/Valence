import { describe, expect, it } from 'vitest';
import { bookFolderInDownload } from './bookFolderInDownload';

describe('bookFolderInDownload', () => {
  it('gives the folder a book’s file is in', () => {
    expect(bookFolderInDownload({ name: '01.mp3', path: '/pack/First/01.mp3', sizeBytes: 0 })).toBe(
      '/pack/First',
    );
  });

  it('takes a disc’s folder as part of the book around it', () => {
    expect(
      bookFolderInDownload({ name: '01.mp3', path: '/pack/First/CD 2/01.mp3', sizeBytes: 0 }),
    ).toBe('/pack/First');
  });
});
