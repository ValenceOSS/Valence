import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { theListeningStatus } from './theListeningStatus';

const NOW = 1_755_000_000_000;

describe('theListeningStatus', () => {
  it('says a track, who made it and the whole of it, from where it has got to', () => {
    expect(
      theListeningStatus({
        title: 'A Song',
        artists: ['A Band'],
        durationSeconds: 200,
        positionSeconds: 50,
        isPlaying: true,
        artwork: null,
        party: null,
        settings: DEFAULT_DISCORD_PRESENCE,
        now: NOW,
      }),
    ).toMatchObject({
      kind: 'listening',
      title: 'A Song',
      artists: ['A Band'],
      startedAt: NOW - 50_000,
      endsAt: NOW - 50_000 + 200_000,
      isPaused: false,
      look: { statusShows: 'valence' },
    });
  });

  it('carries no end for a track of no known length', () => {
    expect(
      theListeningStatus({
        title: 'A Song',
        artists: [],
        durationSeconds: 0,
        positionSeconds: 0,
        isPlaying: false,
        artwork: null,
        party: null,
        settings: DEFAULT_DISCORD_PRESENCE,
        now: NOW,
      }),
    ).toMatchObject({ endsAt: null, isPaused: true });
  });
});
