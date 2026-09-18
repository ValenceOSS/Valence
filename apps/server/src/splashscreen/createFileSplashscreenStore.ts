import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  contentTypeFor,
  extensionFor,
  whatIsWrongWithThePicture,
} from '@ValenceServer/profiles/whatIsWrongWithThePicture';
import { SPLASHSCREEN_LIMITS } from './SplashscreenStore';
import { splashscreenAddress } from './splashscreenAddress';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { SplashscreenStore } from './SplashscreenStore';

/**
 * The picture behind the way in, kept as a file beside the profile pictures and named in the
 * server's settings.
 *
 * Beside the profile pictures because it shares their one rule: it is the only copy of itself, so
 * it lives on the volume that survives, not in the cache that may be thrown away. Each picture gets
 * a name of its own, so a replaced one is a different address and nothing that cached the old one
 * goes on drawing it; the old file is removed once the new one is in force.
 *
 * @param directory - Where the file is kept, which is where profile pictures are.
 * @param settings - Where the name of the current picture is kept.
 * @returns The store.
 */
const createFileSplashscreenStore = (
  directory: string,
  settings: SettingsStore,
): SplashscreenStore => {
  const current = async (): Promise<string | null> => (await settings.read()).splashscreenFile;

  const forget = async (file: string): Promise<void> => {
    await unlink(join(directory, file)).catch(() => undefined);
  };

  return {
    read: async () => {
      const file = await current();

      if (file === null) {
        return null;
      }

      const body = await readFile(join(directory, file)).catch(() => null);

      return body === null
        ? null
        : { body, contentType: contentTypeFor(extname(file)) ?? 'image/jpeg' };
    },

    address: async () => {
      const file = await current();

      return file === null ? null : splashscreenAddress(file);
    },

    save: async (picture) => {
      const wrong = await whatIsWrongWithThePicture(picture, SPLASHSCREEN_LIMITS);

      if (wrong !== null) {
        return wrong;
      }

      const before = await current();
      const file = `splashscreen-${randomUUID()}${extensionFor(picture.contentType) ?? '.jpg'}`;

      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, file), picture.body);
      await settings.write({ splashscreenFile: file });

      if (before !== null) {
        await forget(before);
      }

      return null;
    },

    remove: async () => {
      const before = await current();

      if (before === null) {
        return false;
      }

      await settings.write({ splashscreenFile: null });
      await forget(before);

      return true;
    },
  };
};

export { createFileSplashscreenStore };
