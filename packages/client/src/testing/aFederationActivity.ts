import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';

/**
 * One line of the record between two servers, with whatever a test cares about changed: by default
 * Sam asking about a title once, and being let.
 *
 * @param change - What differs.
 * @returns The line.
 */
const aFederationActivity = (change: Partial<FederationActivity> = {}): FederationActivity => ({
  id: '00000000-0000-4000-8000-0000000000e1',
  at: '2026-10-02T12:00:00.000Z',
  personId: '00000000-0000-4000-8000-000000000003',
  personName: 'Sam',
  action: 'media',
  mediaTitle: 'Arrival',
  outcome: 'allowed',
  count: 1,
  ...change,
});

export { aFederationActivity };
