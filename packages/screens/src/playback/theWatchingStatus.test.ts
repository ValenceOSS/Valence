import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { theWatchingStatus } from './theWatchingStatus';

const NOW = 1_755_000_000_000;

describe('theWatchingStatus', () => {
  it('says an episode by its series and numbers, spanning the whole of it', () => {
    expect(
      theWatchingStatus({
        media: {
          title: 'The One With The Thing',
          seriesTitle: 'A Programme',
          seasonNumber: 2,
          episodeNumber: 12,
          externalId: '1399',
          durationSeconds: 1400,
        },
        positionSeconds: 100,
        isPlaying: true,
        party: null,
        settings: DEFAULT_DISCORD_PRESENCE,
        now: NOW,
      }),
    ).toMatchObject({
      kind: 'watching',
      series: 'A Programme',
      season: 2,
      episode: 12,
      isSeries: true,
      startedAt: NOW - 100_000,
      endsAt: NOW - 100_000 + 1_400_000,
      tmdbId: '1399',
      isPaused: false,
    });
  });

  it('says a film belongs to no series and carries no end it does not know', () => {
    expect(
      theWatchingStatus({
        media: { title: 'A Film' },
        positionSeconds: 0,
        isPlaying: false,
        party: null,
        settings: DEFAULT_DISCORD_PRESENCE,
        now: NOW,
      }),
    ).toMatchObject({ series: null, isSeries: false, endsAt: null, isPaused: true });
  });

  it('carries how the profile wants it to look', () => {
    expect(
      theWatchingStatus({
        media: { title: 'A Film' },
        positionSeconds: 0,
        isPlaying: true,
        party: null,
        settings: { ...DEFAULT_DISCORD_PRESENCE, logo: 'dark' },
        now: NOW,
      }).look.logo,
    ).toBe('dark');
  });
});
