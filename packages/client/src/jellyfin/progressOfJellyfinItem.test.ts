import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { progressOfJellyfinItem } from './progressOfJellyfinItem';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('progressOfJellyfinItem', () => {
  it('reads how far somebody got', () => {
    expect(
      progressOfJellyfinItem(aJellyfinFilm(), createJellyfinIdBook(aFakeStore())),
    ).toMatchObject({
      positionSeconds: 30,
      durationSeconds: 60,
      isFinished: false,
    });
  });

  it('reads something finished, and nothing for something never started', () => {
    const book = createJellyfinIdBook(aFakeStore());

    expect(
      progressOfJellyfinItem(aJellyfinFilm({ UserData: { Played: true } }), book)?.isFinished,
    ).toBe(true);
    expect(
      progressOfJellyfinItem(aJellyfinFilm({ UserData: { PlaybackPositionTicks: 0 } }), book),
    ).toBeNull();
  });
});
