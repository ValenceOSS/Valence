import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';

/**
 * A qBittorrent client as kept, switched on, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The client.
 */
const aDownloadClient = (overrides: Partial<DownloadClientRecord> = {}): DownloadClientRecord => ({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: '',
  password: '',
  apiKey: '',
  categories: DEFAULT_DOWNLOAD_CATEGORIES,
  remotePath: '',
  localPath: '',
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aDownloadClient };
