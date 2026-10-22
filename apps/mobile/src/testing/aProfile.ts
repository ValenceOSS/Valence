import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

/**
 * A profile to draw a screen against.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The profile.
 */
const aProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: '176acd29-9b53-4193-831d-291bc7a9d4eb',
  name: 'Dan',
  colour: '#e8503a',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export { aProfile };
