import type { DiscordLook, DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';

/**
 * Picks out of somebody's Discord settings the part that decides how their status looks, which is
 * all the window needs to draw it. What may be shown at all is decided here in the page instead.
 *
 * @param presence - Their Discord settings.
 * @returns How their status should look.
 */
const discordLookOf = ({
  statusShows,
  logo,
  showsArtwork,
  time,
  showsTmdbLink,
  showsPartySize,
}: DiscordPresence): DiscordLook => ({
  statusShows,
  logo,
  showsArtwork,
  time,
  showsTmdbLink,
  showsPartySize,
});

export { discordLookOf };
