import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A film, episode or album a request waits for, wanted unless the test says otherwise.
 *
 * @param overrides - What to change.
 * @returns The item, as the requests service shows it.
 */
const aShownRequestItem = (overrides: Partial<RequestItem>): RequestItem => ({
  id: crypto.randomUUID(),
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'wanted',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aShownRequestItem };
