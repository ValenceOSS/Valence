import { describe, expect, it } from 'vitest';
import { audiobookTitleOf } from '@ValenceContracts/functions/audiobookTitleOf';

describe('audiobookTitleOf', () => {
  it('leaves off the edition a shop adds', () => {
    expect(
      audiobookTitleOf({ album: 'Red Rising (Unabridged)', title: 'Red Rising (Unabridged)' }),
    ).toBe('Red Rising');
    expect(audiobookTitleOf({ album: 'Dune [Abridged]', title: null })).toBe('Dune');
  });

  it('takes the briefer of the two where one says the other', () => {
    expect(audiobookTitleOf({ album: 'Red Rising, Book 5 - Dark Age', title: 'Dark Age' })).toBe(
      'Dark Age',
    );
    expect(
      audiobookTitleOf({
        album: 'Golden Son (Unabridged)',
        title: 'Golden Son: Book II of the Red Rising Trilogy (Unabridged)',
      }),
    ).toBe('Golden Son');
  });

  it('keeps the album over a track’s own title that says something else', () => {
    expect(audiobookTitleOf({ album: 'Dune', title: 'Chapter 1' })).toBe('Dune');
  });

  it('says nothing where neither is tagged', () => {
    expect(audiobookTitleOf({ album: ' ', title: undefined })).toBeNull();
  });
});
