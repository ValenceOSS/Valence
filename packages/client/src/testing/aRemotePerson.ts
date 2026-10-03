import type { RemotePerson } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Somebody from a linked server who has asked this one for something, with whatever a test cares
 * about changed: by default Sam, seen once, not blocked.
 *
 * @param change - What differs.
 * @returns The person.
 */
const aRemotePerson = (change: Partial<RemotePerson> = {}): RemotePerson => ({
  id: '00000000-0000-4000-8000-000000000003',
  name: 'Sam',
  firstSeenAt: '2026-10-02T12:00:00.000Z',
  lastSeenAt: '2026-10-02T12:00:00.000Z',
  blockedAt: null,
  ...change,
});

export { aRemotePerson };
