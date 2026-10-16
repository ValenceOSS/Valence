import { createFilePictureStore } from '@ValenceServer/pictures/createFilePictureStore';
import { SPLASHSCREEN_LIMITS } from './SplashscreenStore';
import { splashscreenAddress } from './splashscreenAddress';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import type { SplashscreenStore } from './SplashscreenStore';

/**
 * The picture behind the way in, kept as a file beside the profile pictures and named in the
 * server's settings.
 *
 * @param directory - Where the file is kept, which is where profile pictures are.
 * @param settings - Where the name of the current picture is kept.
 * @returns The store.
 */
const createFileSplashscreenStore = (
  directory: string,
  settings: SettingsStore,
): SplashscreenStore =>
  createFilePictureStore({
    directory,
    current: async () => (await settings.read()).splashscreenFile,
    keep: async (file) => {
      await settings.write({ splashscreenFile: file });
    },
    prefix: 'splashscreen',
    address: splashscreenAddress,
    limits: SPLASHSCREEN_LIMITS,
  });

export { createFileSplashscreenStore };
