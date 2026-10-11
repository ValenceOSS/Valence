import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

/**
 * A server this one is waiting to link with, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The server.
 */
const aLinkedServer = (change: Partial<LinkedServer> = {}): LinkedServer => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  address: 'https://films.example',
  fingerprint: 'fedcba9876543210',
  state: 'awaitingThem',
  createdAt: '2026-10-02T12:00:00.000Z',
  linkedAt: null,
  lastSeenAt: null,
  pictureAt: null,
  ...change,
});

export { aLinkedServer };
