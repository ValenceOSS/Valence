import { LibraryLocksSchema } from '@ValenceContracts/schemas/LibraryLock';
import type { LibraryLocks } from '@ValenceContracts/schemas/LibraryLock';
import type { ServerSettings } from '@ValenceServer/settings/ServerSettings';

/**
 * Reads the library locks kept in the settings, as none where what is kept cannot be read.
 *
 * @param settings - Where the settings are kept.
 * @returns The locks, library by library.
 */
const readLibraryLocks = async (settings: {
  read: () => Promise<Pick<ServerSettings, 'libraryLocks'>>;
}): Promise<LibraryLocks> =>
  LibraryLocksSchema.catch({}).parse((await settings.read()).libraryLocks);

export { readLibraryLocks };
