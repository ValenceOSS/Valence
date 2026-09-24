import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createUploadDisk } from '@ValenceServer/uploads/createUploadDisk';
import { createUploadSessions } from '@ValenceServer/uploads/createUploadSessions';
import { UploadPiecesSchema, UploadStartedSchema } from '@ValenceContracts/schemas/UploadPieces';

const BASE = 'http://localhost:8420';

const LIBRARY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const PIECE = 8;

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-pieces-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const build = async (isAdministrator = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        {
          id: LIBRARY_ID,
          name: 'Films',
          kind: 'movies',
          path: root,
          itemCount: 0,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
          takesRequests: true,
          requestProfileId: null,
          requestPath: null,
        },
      ],
      media: [],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
    presence: createPresenceService(),
    uploadDisk: createUploadDisk(),
    uploadSessions: createUploadSessions(Date.now, 60_000, PIECE),
  });
  const cookie = await signUpForTest(app, {
    name: 'Marques',
    email: 'marques@valence.local',
    password: 'a-long-enough-password',
  });
  const user = store.user[0];

  if (isAdministrator && user !== undefined) {
    user.role = 'admin';

    await makeAdministrator(permissions, user.id);
  }

  /**
   * Sends a request to the app as the one signed in.
   *
   * @param path - Where to, after the library's uploads.
   * @param method - How.
   * @param body - What to send, if anything.
   * @returns The response.
   */
  const send = async (
    path: string,
    method: string,
    body: Uint8Array | null = null,
  ): Promise<Response> =>
    app.request(`${BASE}/api/libraries/${LIBRARY_ID}/uploads${path}`, {
      method,
      headers: { cookie, origin: BASE, 'content-type': 'application/octet-stream' },
      body,
    });

  return { send };
};

const start = async (send: Awaited<ReturnType<typeof build>>['send'], bytes: number) =>
  UploadStartedSchema.parse(
    await (
      await send(
        `/start?${new URLSearchParams({ path: 'Arrival.mkv', bytes: bytes.toString() }).toString()}`,
        'POST',
      )
    ).json(),
  );

describe('uploading media in pieces over HTTP', () => {
  it('lets nobody begin one who could not edit libraries', async () => {
    const { send } = await build(false);

    expect((await send('/start?path=Arrival.mkv&bytes=10', 'POST')).status).toBe(403);
  });

  it('refuses a path or a kind of file the library would not take, before anything is sent', async () => {
    const { send } = await build();

    expect((await send('/start?path=../Arrival.mkv&bytes=10', 'POST')).status).toBe(400);
    expect((await send('/start?path=notes.txt&bytes=10', 'POST')).status).toBe(415);
    expect(await readdir(root)).toEqual([]);
  });

  it('puts a file together from its pieces, sent out of order and one of them twice', async () => {
    const { send } = await build();
    const whole = new Uint8Array(PIECE + 3).map((_, at) => at % 251);
    const started = await start(send, whole.byteLength);

    expect(started).toMatchObject({ pieceBytes: PIECE, pieces: 2 });

    const last = await send(`/${started.uploadId}/pieces/1`, 'PUT', whole.slice(PIECE));

    expect(UploadPiecesSchema.parse(await last.json())).toEqual({ received: [1], pieces: 2 });
    expect((await send(`/${started.uploadId}/finish`, 'POST')).status).toBe(400);

    await send(`/${started.uploadId}/pieces/0`, 'PUT', whole.slice(0, PIECE));
    await send(`/${started.uploadId}/pieces/0`, 'PUT', whole.slice(0, PIECE));

    const status = await send(`/${started.uploadId}`, 'GET');

    expect(UploadPiecesSchema.parse(await status.json())).toEqual({ received: [0, 1], pieces: 2 });

    const finished = await send(`/${started.uploadId}/finish`, 'POST');

    expect(finished.status).toBe(201);
    expect(await finished.json()).toEqual({ path: 'Arrival.mkv', bytes: whole.byteLength });
    expect(new Uint8Array(await readFile(join(root, 'Arrival.mkv')))).toEqual(whole);
    expect(await readdir(root)).toEqual(['Arrival.mkv']);
  });

  it('refuses a piece that is not the size its place says, or past the last', async () => {
    const { send } = await build();
    const started = await start(send, PIECE);

    expect((await send(`/${started.uploadId}/pieces/0`, 'PUT', new Uint8Array(4))).status).toBe(
      400,
    );
    expect((await send(`/${started.uploadId}/pieces/1`, 'PUT', new Uint8Array(PIECE))).status).toBe(
      400,
    );
    expect(
      UploadPiecesSchema.parse(await (await send(`/${started.uploadId}`, 'GET')).json()),
    ).toEqual({
      received: [],
      pieces: 1,
    });
  });

  it('throws the staging file away when the upload is cancelled', async () => {
    const { send } = await build();
    const started = await start(send, PIECE);

    await send(`/${started.uploadId}/pieces/0`, 'PUT', new Uint8Array(PIECE));

    expect((await send(`/${started.uploadId}`, 'DELETE')).status).toBe(204);
    expect(await readdir(root)).toEqual([]);
    expect((await send(`/${started.uploadId}`, 'GET')).status).toBe(404);
  });

  it('says there is no such upload', async () => {
    const { send } = await build();
    const nobody = '11111111-1111-4111-8111-111111111111';

    expect((await send(`/${nobody}`, 'GET')).status).toBe(404);
    expect((await send(`/${nobody}/pieces/0`, 'PUT', new Uint8Array(1))).status).toBe(404);
    expect((await send(`/${nobody}/finish`, 'POST')).status).toBe(404);
  });
});
