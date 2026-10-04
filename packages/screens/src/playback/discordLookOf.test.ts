import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { discordLookOf } from './discordLookOf';

describe('discordLookOf', () => {
  it('keeps how the status looks and leaves out what may be shown, which the page decides', () => {
    const look = discordLookOf({
      ...DEFAULT_DISCORD_PRESENCE,
      logo: 'dark',
      hiddenLibraryIds: ['00000000-0000-4000-8000-0000000000b1'],
    });

    expect(look).toEqual({
      statusShows: 'valence',
      logo: 'dark',
      showsArtwork: true,
      time: 'remaining',
      showsTmdbLink: true,
      showsPartySize: true,
    });
  });
});
