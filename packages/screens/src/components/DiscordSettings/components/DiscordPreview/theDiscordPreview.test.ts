import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { theDiscordPreview } from './theDiscordPreview';

const NOW = 1_755_000_000_000;

const FILM_LIBRARY = '00000000-0000-4000-8000-0000000000b1';

const FILM = MediaSummarySchema.parse({
  id: '00000000-0000-4000-8000-0000000000c1',
  libraryId: FILM_LIBRARY,
  title: 'A Film',
  year: 2016,
  durationSeconds: 6000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  externalId: '550',
  posterUrl: 'https://image.tmdb.org/t/p/w500/a.jpg',
});

const SAMPLES = {
  film: FILM,
  episode: null,
  track: aTrack(1),
};

beforeEach(() => {
  installATestClient({ serverAddress: () => 'https://valence.example' });
});

describe('theDiscordPreview', () => {
  it('shows a film as it would be sent, a third of the way in, with its poster', () => {
    expect(theDiscordPreview('film', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)).toMatchObject({
      type: 3,
      details: 'A Film',
      assets: { large_image: 'https://image.tmdb.org/t/p/w500/a.jpg' },
      timestamps: { start: (NOW - 2_000_000) / 1000, end: (NOW - 2_000_000 + 6_000_000) / 1000 },
    });
  });

  it('makes do with a made-up episode where the libraries have none', () => {
    expect(theDiscordPreview('episode', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)).toMatchObject({
      details: 'Shows',
      state: 'Series 1, Episode 3',
    });
  });

  it('falls back to browsing for whatever the settings leave off, and to nothing without that', () => {
    const hidden = { ...DEFAULT_DISCORD_PRESENCE, hiddenLibraryIds: [FILM_LIBRARY] };

    expect(theDiscordPreview('film', SAMPLES, hidden, NOW)?.details).toBe('Browsing libraries');
    expect(theDiscordPreview('film', SAMPLES, { ...hidden, showsBrowsing: false }, NOW)).toBeNull();
  });

  it('shows the pause, and leaves it off where asked', () => {
    expect(theDiscordPreview('paused', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)).not.toHaveProperty(
      'timestamps',
    );
    expect(
      theDiscordPreview(
        'paused',
        SAMPLES,
        { ...DEFAULT_DISCORD_PRESENCE, showsWhilePaused: false },
        NOW,
      )?.details,
    ).toBe('Browsing libraries');
  });

  it('shows the party in the episode line', () => {
    expect(theDiscordPreview('party', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)?.state).toContain(
      'with 2 others',
    );
  });

  it('names a track after its artists, with its cover from the server', () => {
    expect(theDiscordPreview('music', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)).toMatchObject({
      type: 2,
      name: 'Sleep Token',
      details: 'Track 1',
    });
  });

  it('shows browsing on its own, or nothing where browsing is off', () => {
    expect(theDiscordPreview('browsing', SAMPLES, DEFAULT_DISCORD_PRESENCE, NOW)?.details).toBe(
      'Browsing libraries',
    );
    expect(
      theDiscordPreview(
        'browsing',
        SAMPLES,
        { ...DEFAULT_DISCORD_PRESENCE, showsBrowsing: false },
        NOW,
      ),
    ).toBeNull();
  });
});
