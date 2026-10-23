import { describe, expect, it } from 'vitest';
import { creditsFromChapters } from './creditsFromChapters';

const chapter = (title: string | null, startSeconds: number, endSeconds: number) => ({
  title,
  startSeconds,
  endSeconds,
});

describe('creditsFromChapters', () => {
  it('finds the credits in a chapter named for them, running to the end', () => {
    expect(
      creditsFromChapters(
        [
          chapter('Opening', 0, 90),
          chapter('Act One', 90, 2500),
          chapter('End Credits', 2500, 2600),
        ],
        2600,
      ),
    ).toEqual({ startSeconds: 2500, endSeconds: 2600, isSettled: true });
  });

  it('knows the names other files give them', () => {
    for (const title of ['Credits', 'ED', 'Ending', 'Outro', '[SponsorBlock]: Endcards/Credits']) {
      expect(
        creditsFromChapters([chapter('Story', 0, 2500), chapter(title, 2500, 2600)], 2600),
      ).not.toBeNull();
    }
  });

  it('never reads a chapter called the end of something as the credits', () => {
    expect(
      creditsFromChapters([chapter('Story', 0, 2500), chapter('Credits End', 2500, 2600)], 2600),
    ).toBeNull();
  });

  it('settles it where a preview follows the credits', () => {
    expect(
      creditsFromChapters(
        [
          chapter('Story', 0, 2400),
          chapter('Credits', 2400, 2500),
          chapter('Next Time', 2500, 2560),
        ],
        2560,
      ),
    ).toEqual({ startSeconds: 2400, endSeconds: 2500, isSettled: true });
  });

  it('leaves it unsettled where story follows the credits', () => {
    expect(
      creditsFromChapters(
        [
          chapter('Story', 0, 2400),
          chapter('Credits', 2400, 2500),
          chapter('Epilogue', 2500, 2600),
        ],
        2600,
      ),
    ).toMatchObject({ isSettled: false });
  });

  it('finds nothing where no chapter is named for the credits, or one runs too short to be them', () => {
    expect(creditsFromChapters([chapter('Story', 0, 2600)], 2600)).toBeNull();
    expect(
      creditsFromChapters([chapter('Story', 0, 2595), chapter('Credits', 2595, 2600)], 2600),
    ).toBeNull();
  });
});
