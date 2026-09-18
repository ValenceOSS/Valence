import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { createMemorySplashscreenStore } from './createMemorySplashscreenStore';

const aPicture = async (): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width: 16, height: 9, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer(),
  );

describe('createMemorySplashscreenStore', () => {
  it('keeps a picture and hands it back', async () => {
    const store = createMemorySplashscreenStore();

    await expect(
      store.save({ body: await aPicture(), contentType: 'image/png' }),
    ).resolves.toBeNull();
    await expect(store.read()).resolves.toMatchObject({ contentType: 'image/png' });
    await expect(store.address()).resolves.toMatch(/^\/api\/splashscreen\?v=/);
  });

  it('gives each new picture a new address', async () => {
    const store = createMemorySplashscreenStore();

    await store.save({ body: await aPicture(), contentType: 'image/png' });

    const first = await store.address();

    await store.save({ body: await aPicture(), contentType: 'image/png' });

    expect(await store.address()).not.toBe(first);
  });

  it('judges a picture the way the real store does', async () => {
    await expect(
      createMemorySplashscreenStore().save({ body: await aPicture(), contentType: 'video/mp4' }),
    ).resolves.toBe('notAPicture');
  });

  it('says whether there was a picture to forget', async () => {
    const store = createMemorySplashscreenStore();

    await expect(store.remove()).resolves.toBe(false);
    await store.save({ body: await aPicture(), contentType: 'image/png' });
    await expect(store.remove()).resolves.toBe(true);
    await expect(store.read()).resolves.toBeNull();
  });
});
