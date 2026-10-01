import { describe, expect, it } from 'vitest';
import { eventsFrom } from './eventsFrom';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';

const AT = '2026-03-01T20:00:00.000Z';

const AN_ITEM = {
  itemId: 'item-1',
  kind: 'movie' as const,
  title: 'Dune',
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  year: 2021,
  posterUrl: null,
  libraryId: 'library-1',
  libraryName: 'Films',
  overview: null,
  durationSeconds: null,
  genres: [],
  rating: null,
  quality: null,
};

const PLAYING = {
  accountId: 'account-1',
  accountName: 'Ada',
  profileId: 'profile-1',
  profileName: 'Ada',
  item: AN_ITEM,
  deviceLabel: 'Chrome on macOS',
  mode: 'DirectPlay' as const,
};

const stoppedAt = (positionSeconds: number | null): WebhookOccurrence => ({
  event: 'playback.stopped',
  data: { ...PLAYING, positionSeconds, durationSeconds: 1000 },
});

describe('eventsFrom', () => {
  it('tells plugins who started watching what, and how long it is', () => {
    expect(
      eventsFrom(
        {
          event: 'playback.started',
          data: { ...PLAYING, item: { ...AN_ITEM, durationSeconds: 1000 } },
        },
        AT,
      ),
    ).toEqual([
      {
        topic: 'playback.started',
        occurredAt: AT,
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: null,
        durationSeconds: 1000,
      },
    ]);
  });

  it('tells plugins where someone stopped, so each can judge what counts as a play', () => {
    expect(eventsFrom(stoppedAt(950), AT)).toEqual([
      {
        topic: 'playback.stopped',
        occurredAt: AT,
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: 950,
        durationSeconds: 1000,
      },
      {
        topic: 'playback.finished',
        occurredAt: AT,
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: 950,
        durationSeconds: 1000,
      },
    ]);
  });

  it('counts stopping near the end as finishing', () => {
    expect(eventsFrom(stoppedAt(950), AT).map((event) => event.topic)).toEqual([
      'playback.stopped',
      'playback.finished',
    ]);
    expect(eventsFrom(stoppedAt(300), AT).map((event) => event.topic)).toEqual([
      'playback.stopped',
    ]);
    expect(eventsFrom(stoppedAt(null), AT).map((event) => event.topic)).toEqual([
      'playback.stopped',
    ]);
  });

  it('tells of arrivals without naming anybody', () => {
    expect(eventsFrom({ event: 'media.added', data: AN_ITEM }, AT)).toEqual([
      {
        topic: 'media.added',
        occurredAt: AT,
        profileId: null,
        mediaId: 'item-1',
        positionSeconds: null,
        durationSeconds: null,
      },
    ]);
  });

  it('says nothing of what plugins are not told', () => {
    expect(eventsFrom({ event: 'requests.reachable', data: {} }, AT)).toEqual([]);
  });
});
