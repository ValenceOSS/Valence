import { describe, expect, it } from 'vitest';
import { openLibraryCover } from '@ValenceServer/requests/openLibrary/openLibraryCover';

describe('openLibraryCover', () => {
  it('is the picture kept under the cover’s number', () => {
    expect(openLibraryCover(8_231_991)).toBe('https://covers.openlibrary.org/b/id/8231991-M.jpg');
  });

  it('is nothing for a book with no cover', () => {
    expect(openLibraryCover(null)).toBeNull();
    expect(openLibraryCover(undefined)).toBeNull();
    expect(openLibraryCover(-1)).toBeNull();
  });
});
