import { describe, expect, it } from 'vitest';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import { episodeOfSession } from './episodeOfSession';

const watching = (changes: Parameters<typeof aSessionPlayback>[0]) =>
  anActiveSession({ playback: aSessionPlayback(changes) });

describe('episodeOfSession', () => {
  it('writes an episode the way release names do, padded to two digits, then its title', () => {
    expect(
      episodeOfSession(
        watching({
          seriesTitle: 'The Show',
          seasonNumber: 1,
          episodeNumber: 3,
          mediaTitle: 'The Third One',
        }),
      ),
    ).toBe('S01E03 - The Third One');
  });

  it('leaves numbers that already have two digits as they are', () => {
    expect(
      episodeOfSession(
        watching({
          seriesTitle: 'The Show',
          seasonNumber: 12,
          episodeNumber: 104,
          mediaTitle: 'A Long Run',
        }),
      ),
    ).toBe('S12E104 - A Long Run');
  });

  it('gives only the title when the episode has no number', () => {
    expect(
      episodeOfSession(
        watching({
          seriesTitle: 'The Show',
          seasonNumber: null,
          episodeNumber: 3,
          mediaTitle: 'A Special',
        }),
      ),
    ).toBe('A Special');
  });

  it('says nothing for a film, which belongs to no show', () => {
    expect(episodeOfSession(watching({ seriesTitle: null }))).toBeNull();
  });

  it('says nothing when nothing is playing', () => {
    expect(episodeOfSession(anActiveSession())).toBeNull();
  });
});
