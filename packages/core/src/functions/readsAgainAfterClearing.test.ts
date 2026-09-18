import { describe, expect, it } from 'vitest';
import { readsAgainAfterClearing } from './readsAgainAfterClearing';

describe('readsAgainAfterClearing', () => {
  it('reads every file again for what the catalogue says about each one', () => {
    expect(readsAgainAfterClearing(['descriptions'])).toBe(true);
    expect(readsAgainAfterClearing(['cast'])).toBe(true);
    expect(readsAgainAfterClearing(['ageRatings'])).toBe(true);
    expect(readsAgainAfterClearing(['trailers'])).toBe(true);
    expect(readsAgainAfterClearing(['artwork'])).toBe(true);
  });

  it('reads every file again for what a song carries in its tags', () => {
    expect(readsAgainAfterClearing(['albumCovers'])).toBe(true);
    expect(readsAgainAfterClearing(['artistPictures'])).toBe(true);
    expect(readsAgainAfterClearing(['lyrics'])).toBe(true);
  });

  it('leaves the files alone for what an ordinary scan asks for anyway', () => {
    expect(
      readsAgainAfterClearing(['logos', 'previews', 'scrubPreviews', 'intros', 'musicVideos']),
    ).toBe(false);
  });

  it('reads every file again when any one part needs it', () => {
    expect(readsAgainAfterClearing(['logos', 'cast'])).toBe(true);
  });
});
