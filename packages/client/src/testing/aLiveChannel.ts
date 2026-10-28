import type { LiveChannel } from '@ValenceContracts/schemas/LiveTv';

/**
 * A live TV channel for a test, with anything the test cares about given.
 *
 * @param overrides - What the test sets.
 * @returns The channel.
 */
const aLiveChannel = (overrides: Partial<LiveChannel> = {}): LiveChannel => ({
  id: '00000000-0000-4000-8000-00000000c001',
  sourceId: '00000000-0000-4000-8000-00000000500e',
  number: null,
  name: 'Pluto TV Classic TV',
  group: null,
  region: null,
  health: null,
  checkedAt: null,
  hasLogo: false,
  isFavourite: false,
  isEmbedded: false,
  ...overrides,
});

export { aLiveChannel };
