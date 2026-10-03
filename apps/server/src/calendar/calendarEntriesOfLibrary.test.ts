import { describe, expect, it } from 'vitest';
import { calendarEntriesOfLibrary } from './calendarEntriesOfLibrary';
import type { CalendarEpisode } from './CalendarEpisode';

const SHOW = {
  id: 'show-1',
  libraryId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  title: 'A Show',
  seasonCount: 2,
  episodeCount: 12,
  latestAddedAt: '2026-10-01T10:00:00.000Z',
  coverMediaId: '1b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  seriesId: '2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
};

const anEpisode = (change: Partial<CalendarEpisode>): CalendarEpisode => ({
  show: SHOW,
  externalId: '300',
  seasonNumber: 2,
  episodeNumber: 5,
  title: 'Fifth',
  airDate: '2026-10-08',
  stillUrl: 'https://image.example/still.jpg',
  isHeld: false,
  ...change,
});

describe('calendarEntriesOfLibrary', () => {
  it('names an episode by the catalogue, so a request for it is the same entry', () => {
    const [entry] = calendarEntriesOfLibrary([anEpisode({})], '2026-10-02');

    expect(entry).toMatchObject({
      id: 'tv:300:s2e5',
      date: '2026-10-08',
      release: 'airs',
      title: 'A Show',
      episode: {
        seasonNumber: 2,
        episodeNumber: 5,
        title: 'Fifth',
        stillUrl: 'https://image.example/still.jpg',
      },
      artworkMediaId: SHOW.coverMediaId,
      source: 'library',
      opens: { kind: 'show', showId: SHOW.seriesId },
    });
  });

  it('calls an episode on disk available, one to come not out yet, and one missed not held', () => {
    const states = calendarEntriesOfLibrary(
      [
        anEpisode({ isHeld: true, airDate: '2026-09-30' }),
        anEpisode({ episodeNumber: 6, airDate: '2026-10-09' }),
        anEpisode({ episodeNumber: 4, airDate: '2026-10-01' }),
      ],
      '2026-10-02',
    ).map((entry) => entry.state);

    expect(states).toEqual(['available', 'notOutYet', 'notHeld']);
  });

  it('opens a show with no series by its own id', () => {
    const [entry] = calendarEntriesOfLibrary(
      [anEpisode({ show: { ...SHOW, seriesId: null } })],
      '2026-10-02',
    );

    expect(entry?.opens).toEqual({ kind: 'show', showId: 'show-1' });
  });
});
