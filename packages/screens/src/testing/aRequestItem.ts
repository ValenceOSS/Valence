import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

/**
 * One film, episode or album a request is waiting on, still wanted, with anything a test cares
 * about changed.
 *
 * @param overrides - What to change.
 * @returns The item, as the server shows it.
 */
const aRequestItem = (overrides: Partial<RequestItem> = {}): RequestItem => ({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'wanted',
  problem: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes: null,
  downloadSeconds: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aRequestItem };
