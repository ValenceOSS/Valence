import type { Indexer } from '@ValenceContracts/schemas/Indexer';

/**
 * An indexer as Valence shows it: a working Torznab one kept for every library, with anything a
 * test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The indexer.
 */
const anIndexer = (overrides: Partial<Indexer> = {}): Indexer => ({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  sourceAppId: null,
  sourceIndexerId: null,
  libraryIds: [],
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { anIndexer };
