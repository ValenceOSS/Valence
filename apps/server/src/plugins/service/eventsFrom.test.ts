import { describe, expect, it } from 'vitest';
import { eventsFrom } from './eventsFrom';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';

const AT = '2026-03-01T20:00:00.000Z';

const AN_ITEM = {
  itemId: 'item-1',
  kind: 'movie' as const,
  title: 'Film',
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  year: 2016,
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
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: null,
        durationSeconds: 1000,
        client: { kind: null, label: 'Chrome on macOS' },
      },
    ]);
  });

  it('tells plugins where someone stopped, so each can judge what counts as a play', () => {
    expect(eventsFrom(stoppedAt(950), AT)).toEqual([
      {
        topic: 'playback.stopped',
        occurredAt: AT,
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: 950,
        durationSeconds: 1000,
        client: { kind: null, label: 'Chrome on macOS' },
      },
      {
        topic: 'playback.finished',
        occurredAt: AT,
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: 950,
        durationSeconds: 1000,
        client: { kind: null, label: 'Chrome on macOS' },
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

  it('counts stopping in the credits as finishing, by the rule that marks it watched', () => {
    const credits = [
      { kind: 'credits' as const, startSeconds: 840, endSeconds: 1000, source: 'manual' as const },
    ];

    expect(eventsFrom(stoppedAt(850), AT, credits).map((event) => event.topic)).toEqual([
      'playback.stopped',
      'playback.finished',
    ]);
    expect(eventsFrom(stoppedAt(850), AT).map((event) => event.topic)).toEqual([
      'playback.stopped',
    ]);
  });

  it('judges finishing against how long the library knows it runs, not what the player had', () => {
    const growing: WebhookOccurrence = {
      event: 'playback.stopped',
      data: {
        ...PLAYING,
        item: { ...AN_ITEM, durationSeconds: 1000 },
        positionSeconds: 500,
        durationSeconds: 520,
      },
    };

    expect(eventsFrom(growing, AT).map((event) => event.topic)).toEqual(['playback.stopped']);
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

  it('tells of someone opening and leaving Valence by device name, never its address', () => {
    const session = {
      accountId: 'account-1',
      accountName: 'Ada',
      profileId: 'profile-1',
      profileName: 'Ada',
      clientId: 'client-1',
      deviceLabel: 'Safari on iPhone',
      address: '203.0.113.9',
      guestOf: null,
      viaShare: null,
    };
    const told = [
      ...eventsFrom({ event: 'session.started', data: session }, AT),
      ...eventsFrom({ event: 'session.ended', data: { ...session, lastedSeconds: 600 } }, AT),
    ];

    expect(told).toEqual([
      {
        topic: 'session.started',
        occurredAt: AT,
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: null,
        positionSeconds: null,
        durationSeconds: null,
        client: { kind: null, label: 'Safari on iPhone' },
      },
      {
        topic: 'session.ended',
        occurredAt: AT,
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: null,
        positionSeconds: null,
        durationSeconds: 600,
        client: { kind: null, label: 'Safari on iPhone' },
      },
    ]);
    expect(JSON.stringify(told)).not.toContain('203.0.113.9');
  });

  it('tells of a request made, approved or refused, as the person who asked', () => {
    const request = {
      id: 'request-1',
      kind: 'film' as const,
      title: 'Film',
      artistName: null,
      year: 2016,
      overview: null,
      posterUrl: null,
      requestedBy: 'Ada',
      requestedByAccountId: 'account-1',
      requestedByProfile: 'Ada',
      requestedByProfileId: 'profile-1',
      askers: [],
      seasons: null,
      state: 'awaitingApproval' as const,
    };
    const asked = {
      topic: 'requests.made',
      occurredAt: AT,
      accountId: 'account-1',
      profileId: 'profile-1',
      mediaId: null,
      positionSeconds: null,
      durationSeconds: null,
      requestId: 'request-1',
    };

    expect(
      eventsFrom(
        {
          event: 'requests.made',
          data: {
            title: 'Film',
            kind: 'film',
            requestedBy: 'Ada',
            accountId: 'account-1',
            profileId: 'profile-1',
            profileName: 'Ada',
            request,
          },
        },
        AT,
      ),
    ).toEqual([asked]);
    expect(
      eventsFrom(
        { event: 'requests.approved', data: { title: 'Film', approvedBy: 'Sam', request } },
        AT,
      ),
    ).toEqual([{ ...asked, topic: 'requests.approved' }]);
    expect(
      eventsFrom(
        { event: 'requests.refused', data: { title: 'Film', reason: null, request: null } },
        AT,
      ),
    ).toEqual([]);
  });

  it('says nothing of what plugins are not told', () => {
    expect(eventsFrom({ event: 'requests.reachable', data: {} }, AT)).toEqual([]);
  });
});
