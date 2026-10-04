import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE, DiscordPresenceSchema } from './DiscordPresence';

describe('DiscordPresenceSchema', () => {
  it('starts from what Discord was shown before there were settings', () => {
    expect(DEFAULT_DISCORD_PRESENCE).toEqual({
      statusShows: 'valence',
      logo: 'light',
      showsArtwork: true,
      showsWhilePaused: true,
      showsBrowsing: true,
      time: 'remaining',
      showsTmdbLink: true,
      showsPartySize: true,
      sharesFilms: true,
      sharesShows: true,
      sharesMusic: true,
      hiddenLibraryIds: [],
    });
  });

  it('fills in whatever a stored set leaves out, so settings added later need nothing moved', () => {
    expect(DiscordPresenceSchema.parse({ logo: 'dark' })).toEqual({
      ...DEFAULT_DISCORD_PRESENCE,
      logo: 'dark',
    });
  });

  it('refuses a logo or a status it does not know', () => {
    expect(DiscordPresenceSchema.safeParse({ logo: 'sepia' }).success).toBe(false);
    expect(DiscordPresenceSchema.safeParse({ statusShows: 'artist' }).success).toBe(false);
  });

  it('only hides libraries named by their id', () => {
    expect(DiscordPresenceSchema.safeParse({ hiddenLibraryIds: ['Films'] }).success).toBe(false);
  });
});
