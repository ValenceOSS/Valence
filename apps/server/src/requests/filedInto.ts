import type { MediaRequestChange } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Makes a change to a request that files it only where the library it is moved into says: a filing
 * folder the person asking wrote is never kept.
 *
 * @param change - What the person asked to change.
 * @param into - The library the request is moved into, or nothing where it is not moved.
 * @returns The change, with the library's folder as its filing folder where there is a library.
 */
const filedInto = (
  change: MediaRequestChange,
  into: { path: string; requestPath?: string | null } | undefined,
): MediaRequestChange => {
  const { libraryPath: _asked, ...rest } = change;

  return into === undefined ? rest : { ...rest, libraryPath: into.requestPath ?? into.path };
};

export { filedInto };
