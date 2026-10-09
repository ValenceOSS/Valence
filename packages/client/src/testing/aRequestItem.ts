import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

/**
 * One episode of a requested programme, the first of the first season and still wanted, with
 * anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The item, as the server shows it.
 */
const aRequestItem = (overrides: Partial<RequestItem> = {}): RequestItem => ({
  id: '6ba7b810-9dad-11d1-80b4-000000000001',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: '',
  airDate: null,
  state: 'wanted',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes: null,
  downloadSeconds: null,
  isFollowed: true,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aRequestItem };
