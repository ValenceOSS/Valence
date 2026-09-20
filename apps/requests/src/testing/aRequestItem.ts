import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * A wanted film, never searched for, belonging to the request `aMediaRequest` makes, with anything
 * a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The film or episode as kept.
 */
const aRequestItem = (overrides: Partial<RequestItemRecord> = {}): RequestItemRecord => ({
  id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
  requestId: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  season: null,
  episode: null,
  title: 'Dune',
  airDate: '2021-12-03',
  state: 'wanted',
  problem: null,
  releaseTitle: null,
  indexerId: null,
  downloadId: null,
  filePath: null,
  score: null,
  filedTitle: null,
  filedScore: null,
  attempts: 0,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aRequestItem };
