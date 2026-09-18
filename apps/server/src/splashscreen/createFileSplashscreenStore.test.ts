import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { createFileSplashscreenStore } from './createFileSplashscreenStore';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';

const aPicture = async (width = 16, height = 9): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .jpeg()
      .toBuffer(),
  );

let directory = '';
let settings: SettingsStore;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'valence-splashscreen-'));
  settings = createMemorySettingsStore(
    ServerSettingsSchema.parse({ trustedOrigins: [], cookieSecure: false, setupCompletedAt: null }),
  );
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('createFileSplashscreenStore', () => {
  it('has nothing to show before a picture is chosen', async () => {
    const store = createFileSplashscreenStore(directory, settings);

    await expect(store.read()).resolves.toBeNull();
    await expect(store.address()).resolves.toBeNull();
  });

  it('keeps a picture on disk, names it in the settings, and reads it back', async () => {
    const store = createFileSplashscreenStore(directory, settings);
    const body = await aPicture();

    await expect(store.save({ body, contentType: 'image/jpeg' })).resolves.toBeNull();

    const { splashscreenFile } = await settings.read();

    expect(await readdir(directory)).toEqual([splashscreenFile]);
    expect(await store.address()).toContain(splashscreenFile);
    await expect(store.read()).resolves.toMatchObject({ contentType: 'image/jpeg' });
  });

  it('gives a replaced picture a new address and throws the old file away', async () => {
    const store = createFileSplashscreenStore(directory, settings);

    await store.save({ body: await aPicture(), contentType: 'image/jpeg' });

    const first = await store.address();

    await store.save({ body: await aPicture(32, 18), contentType: 'image/jpeg' });

    expect(await store.address()).not.toBe(first);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('allows the detail a full-screen picture needs, which a face is refused', async () => {
    const store = createFileSplashscreenStore(directory, settings);

    await expect(
      store.save({ body: await aPicture(5000, 8), contentType: 'image/jpeg' }),
    ).resolves.toBeNull();
  });

  it('refuses something that is not a picture, and keeps nothing of it', async () => {
    const store = createFileSplashscreenStore(directory, settings);

    await expect(
      store.save({ body: new TextEncoder().encode('not a picture'), contentType: 'image/jpeg' }),
    ).resolves.toBe('unreadable');
    expect(await readdir(directory)).toEqual([]);
    await expect(store.address()).resolves.toBeNull();
  });

  it('goes back to nothing, removing the file, and says whether there was one', async () => {
    const store = createFileSplashscreenStore(directory, settings);

    await store.save({ body: await aPicture(), contentType: 'image/jpeg' });

    await expect(store.remove()).resolves.toBe(true);
    await expect(store.remove()).resolves.toBe(false);
    expect(await readdir(directory)).toEqual([]);
    await expect(store.read()).resolves.toBeNull();
  });
});
