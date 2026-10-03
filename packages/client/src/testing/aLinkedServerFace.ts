import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';

/**
 * A linked server as anybody here sees it, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The server.
 */
const aLinkedServerFace = (change: Partial<LinkedServerFace> = {}): LinkedServerFace => ({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Films',
  colour: '#e8503a',
  isReachable: true,
  takesRequests: false,
  ...change,
});

export { aLinkedServerFace };
