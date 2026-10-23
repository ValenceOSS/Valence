import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { PACKAGE_LIMITS } from '@ValenceSDK/package/PACKAGE_LIMITS';
import { SPLASHSCREEN_LIMITS } from '@ValenceServer/splashscreen/SplashscreenStore';
import { HOUSEHOLD_LIMITS } from '@ValenceServer/household/HouseholdPicture';
import { BRAND_LOGO_LIMITS } from '@ValenceServer/brand/BRAND_LOGO_LIMITS';
import { ARTWORK_LIMITS } from '@ValenceServer/playlists/ARTWORK_LIMITS';
import { FACE_LIMITS } from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { createBodyLimit } from './createBodyLimit';
import { MOST_FILE_BYTES } from './MOST_FILE_BYTES';
import { SMALL_BODY_BYTES } from './SMALL_BODY_BYTES';

const anApp = () => {
  const app = new Hono();

  app.use('/api/*', createBodyLimit());
  app.all('/api/*', async (context) => {
    await context.req.arrayBuffer();

    return context.text('reached');
  });

  return app;
};

const unsized = (bytes: number): ReadableStream<Uint8Array> => {
  let left = bytes;

  return new ReadableStream({
    pull: (controller) => {
      const piece = Math.min(left, 64 * 1024);

      if (piece === 0) {
        controller.close();

        return;
      }

      controller.enqueue(new Uint8Array(piece));
      left -= piece;
    },
  });
};

const send = (path: string, type: string, bytes: number) =>
  anApp().request(path, {
    method: 'POST',
    headers: type === '' ? {} : { 'content-type': type },
    body: unsized(bytes),
    duplex: 'half',
  } satisfies RequestInit & { duplex: 'half' });

describe('createBodyLimit', () => {
  it('refuses JSON larger than anything here would read, even when it gives no length', async () => {
    const answer = await send('/api/admin/announcement', 'application/json', SMALL_BODY_BYTES + 1);

    expect(answer.status).toBe(413);
  });

  it('holds any kind of JSON to the small limit', async () => {
    const answer = await send(
      '/api/admin/announcement',
      'application/merge-patch+json',
      SMALL_BODY_BYTES + 1,
    );

    expect(answer.status).toBe(413);
  });

  it('refuses a body that says nothing of what it is past the small limit', async () => {
    const answer = await send('/api/admin/announcement', '', SMALL_BODY_BYTES + 1);

    expect(answer.status).toBe(413);
  });

  it('lets a picture larger than a JSON body through to the route that takes it', async () => {
    const answer = await send('/api/admin/splashscreen', 'image/png', SMALL_BODY_BYTES * 4);

    expect(await answer.text()).toBe('reached');
  });

  it('refuses a file larger than any route takes', async () => {
    const answer = await send('/api/admin/splashscreen', 'image/png', MOST_FILE_BYTES + 1);

    expect(answer.status).toBe(413);
  });

  it('holds what answers without a session to the small limit, whatever it says it is', async () => {
    const answer = await send('/api/auth/sign-in/email', 'image/png', SMALL_BODY_BYTES + 1);

    expect(answer.status).toBe(413);
  });

  it('leaves a file uploaded into a library alone, since it goes to disk as it arrives', async () => {
    const answer = await send(
      '/api/libraries/a-library/uploads/an-upload/pieces/0',
      'application/octet-stream',
      MOST_FILE_BYTES + 1,
    );

    expect(await answer.text()).toBe('reached');
  });

  it('is at least as large as every file a route takes', () => {
    const largest = Math.max(
      PACKAGE_LIMITS.packageBytes,
      SPLASHSCREEN_LIMITS.mostBytes,
      HOUSEHOLD_LIMITS.mostBytes,
      BRAND_LOGO_LIMITS.mostBytes,
      ARTWORK_LIMITS.mostBytes,
      FACE_LIMITS.mostBytes,
    );

    expect(MOST_FILE_BYTES).toBeGreaterThanOrEqual(largest);
  });
});
