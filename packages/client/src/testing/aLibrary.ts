import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * A library of this server's own, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The library.
 */
const aLibrary = (change: Partial<Library> = {}): Library => ({
  id: '00000000-0000-4000-8000-0000000000a1',
  name: 'Films',
  kind: 'movies',
  path: '/films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: false,
  requestProfileId: null,
  requestPath: null,
  linkedServerId: null,
  ...change,
});

export { aLibrary };
