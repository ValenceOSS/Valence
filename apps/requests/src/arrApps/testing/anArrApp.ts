import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';

/**
 * A Radarr as kept, switched on and never checked, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The app.
 */
const anArrApp = (overrides: Partial<ArrAppRecord> = {}): ArrAppRecord => ({
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Radarr',
  kind: 'radarr',
  url: 'http://radarr:7878',
  apiKey: 'radarr-key',
  remotePath: '',
  localPath: '',
  isEnabled: true,
  isWorking: null,
  version: null,
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  ...overrides,
});

export { anArrApp };
