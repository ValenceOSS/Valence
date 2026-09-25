import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * A library whose folder is somewhere a test chose, for the file manager's tests.
 *
 * @param path - Its folder.
 * @param id - What to call it.
 * @returns The library.
 */
const aLibraryAt = (path: string, id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'): Library => ({
  id,
  // eslint-disable-next-line valence/no-hard-coded-strings -- a test fixture
  name: 'Films',
  kind: 'movies',
  path,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

export { aLibraryAt };
