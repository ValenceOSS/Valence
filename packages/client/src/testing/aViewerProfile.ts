import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

/**
 * A profile to test with: an owner with no PIN who may ask for things, unless the test says otherwise.
 *
 * @param overrides - Whatever this test needs to be different.
 * @returns The profile.
 */
const aViewerProfile = (overrides: Partial<ViewerProfile> = {}): ViewerProfile => ({
  id: 'profile-1',
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

export { aViewerProfile };
