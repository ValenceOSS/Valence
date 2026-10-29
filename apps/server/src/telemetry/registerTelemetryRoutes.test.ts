import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { TelemetryPreviewSchema } from '@ValenceContracts/schemas/TelemetryPreview';
import type { TelemetryPreview } from '@ValenceContracts/schemas/TelemetryPreview';
import { NO_TELEMETRY } from './NO_TELEMETRY';
import type { TelemetryService } from './TelemetryService';

const BASE = 'http://localhost:8420';

const ID = '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41';

const PREVIEW: TelemetryPreview = TelemetryPreviewSchema.parse({
  isSending: true,
  heldOffBy: null,
  address: 'https://metrics.getvalence.app/api/v1/reports',
  report: {
    schemaVersion: 1,
    installId: ID,
    version: '1.8.0',
    installMethod: 'docker',
    os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
    cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 16 },
    memoryGb: '32-64',
    gpus: [],
    accels: [],
    database: 'postgres',
    library: { films: '0', episodes: '0', tracks: '0', books: '0' },
    clients: {},
  },
});

/**
 * The app over a telemetry service, signed in as somebody who may or may not administer it.
 *
 * @param telemetry - The telemetry service.
 * @param isAdministrator - Whether they hold every permission.
 * @returns The app.
 */
const build = (telemetry: TelemetryService, isAdministrator: boolean) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    telemetry,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
  });

  return signedInApp(app, { auth, store, permissions, isAdministrator });
};

describe('the telemetry endpoints', () => {
  it('shows an administrator the exact report that would be sent', async () => {
    const app = build({ ...NO_TELEMETRY, preview: () => Promise.resolve(PREVIEW) }, true);

    const read = await app.request(`${BASE}/api/admin/telemetry/preview`);

    expect(read.status).toBe(200);
    expect(await read.json()).toEqual(PREVIEW);
  });

  it('makes a new install id for an administrator', async () => {
    const resetInstallId = vi.fn(() => Promise.resolve(ID));
    const app = build({ ...NO_TELEMETRY, resetInstallId }, true);

    const made = await app.request(`${BASE}/api/admin/telemetry/reset-id`, { method: 'POST' });

    expect(made.status).toBe(200);
    expect(await made.json()).toEqual({ installId: ID });
    expect(resetInstallId).toHaveBeenCalledOnce();
  });

  it('is for administrators only', async () => {
    const resetInstallId = vi.fn(() => Promise.resolve(ID));
    const app = build({ ...NO_TELEMETRY, resetInstallId }, false);

    expect((await app.request(`${BASE}/api/admin/telemetry/preview`)).status).toBe(403);
    expect(
      (await app.request(`${BASE}/api/admin/telemetry/reset-id`, { method: 'POST' })).status,
    ).toBe(403);
    expect(resetInstallId).not.toHaveBeenCalled();
  });
});
