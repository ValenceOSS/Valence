import { z } from 'zod';

const DiscordPresenceSchema = z.object({
  statusShows: z.enum(['valence', 'title']).default('valence'),
  logo: z.enum(['light', 'dark']).default('light'),
  showsArtwork: z.boolean().default(true),
  showsWhilePaused: z.boolean().default(true),
  showsBrowsing: z.boolean().default(true),
  time: z.enum(['remaining', 'elapsed']).default('remaining'),
  showsTmdbLink: z.boolean().default(true),
  showsPartySize: z.boolean().default(true),
  sharesFilms: z.boolean().default(true),
  sharesShows: z.boolean().default(true),
  sharesMusic: z.boolean().default(true),
  hiddenLibraryIds: z.array(z.string().uuid()).max(200).default([]),
});

const DiscordLookSchema = DiscordPresenceSchema.pick({
  statusShows: true,
  logo: true,
  showsArtwork: true,
  time: true,
  showsTmdbLink: true,
  showsPartySize: true,
});

type DiscordPresence = z.infer<typeof DiscordPresenceSchema>;

type DiscordLook = z.infer<typeof DiscordLookSchema>;

const DEFAULT_DISCORD_PRESENCE: DiscordPresence = DiscordPresenceSchema.parse({});

export type { DiscordLook, DiscordPresence };

export { DEFAULT_DISCORD_PRESENCE, DiscordLookSchema, DiscordPresenceSchema };
