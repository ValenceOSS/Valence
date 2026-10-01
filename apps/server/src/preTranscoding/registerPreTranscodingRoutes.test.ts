import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import {
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodingStatusSchema,
} from '@ValenceContracts/schemas/PreTranscoding';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { PreTranscodingSettings } from '@ValenceContracts/schemas/PreTranscoding';
import type { PreTranscodingService } from './PreTranscodingService';

const BASE = 'http://localhost:8420';

/**
 * The API over a pre-transcoding service that holds its settings and remembers what it was asked.
 *
 * @param isAdministrator - Whether whoever is signed in may re-encode.
 * @returns The signed-in app, and what the service was asked.
 */
const build = (isAdministrator = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  let held: PreTranscodingSettings = PRE_TRANSCODING_DEFAULTS;
  const runNow = vi.fn<(askedBy: string) => Promise<boolean>>(() => Promise.resolve(true));

  const statusOf = () => ({
    settings: held,
    copiesMade: 0,
    stillNeeded: 2,
    givenUp: 0,
    current: null,
    isInWindow: true,
    timezone: 'UTC',
  });

  const preTranscoding: PreTranscodingService = {
    status: () => Promise.resolve(statusOf()),
    save: (next) => {
      held = next;

      return Promise.resolve(statusOf());
    },
    runNow,
    tick: () => Promise.resolve({ kind: 'off' }),
  };

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    preTranscoding,
  });

  return {
    app,
    runNow,
    signedIn: signedInApp(app, { store, permissions, settings, isAdministrator }),
  };
};

describe('pre-transcoding over the API', () => {
  it('says nothing to somebody who is not signed in', async () => {
    const { app } = build();

    expect((await app.request(`${BASE}/api/pre-transcoding`)).status).toBe(401);
  });

  it('refuses an account that may not re-encode', async () => {
    const { signedIn } = build(false);

    expect((await signedIn.request(`${BASE}/api/pre-transcoding`)).status).toBe(403);
  });

  it('reads the settings and how far it has got', async () => {
    const { signedIn } = build();

    const response = await signedIn.request(`${BASE}/api/pre-transcoding`);

    expect(response.status).toBe(200);
    expect(
      PreTranscodingStatusSchema.parse(JsonValueSchema.parse(await response.json())).stillNeeded,
    ).toBe(2);
  });

  it('saves settings it can take, and refuses ones it cannot', async () => {
    const { signedIn } = build();
    const saving = (body: object) =>
      signedIn.request(`${BASE}/api/pre-transcoding`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const saved = await saving({ ...PRE_TRANSCODING_DEFAULTS, isEnabled: true, windowEndHour: 7 });

    expect(saved.status).toBe(200);
    expect(
      PreTranscodingStatusSchema.parse(JsonValueSchema.parse(await saved.json())).settings,
    ).toMatchObject({ isEnabled: true, windowEndHour: 7 });
    expect((await saving({ ...PRE_TRANSCODING_DEFAULTS, windowStartHour: 25 })).status).toBe(400);
  });

  it('makes the next copy now, saying who asked', async () => {
    const { signedIn, runNow } = build();

    const response = await signedIn.request(`${BASE}/api/pre-transcoding/run`, { method: 'POST' });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ queued: true });
    expect(runNow).toHaveBeenCalledWith(expect.any(String));
  });
});
