import { describe, expect, it } from 'vitest';
import { applyWordRules } from './applyWordRules';

describe('applyWordRules', () => {
  it('renames and takes out the words the rules find, merging any left twice', () => {
    expect(
      applyWordRules(
        ['Sci-Fi', 'Science Fiction', 'Unwanted', 'Drama'],
        [
          { find: 'sci-fi', replace: 'Science Fiction' },
          { find: 'Unwanted', replace: '' },
        ],
      ),
    ).toEqual(['Science Fiction', 'Drama']);
  });

  it('leaves nothing as nothing', () => {
    expect(applyWordRules(null, [{ find: 'a', replace: 'b' }])).toBeNull();
  });
});
