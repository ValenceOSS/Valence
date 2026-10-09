import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Whether every library of some kinds that takes requests hands them to a connected app, so
 * nothing Valence fetches itself is left for them — and not where none takes requests at all.
 *
 * @param libraries - Every library.
 * @param kinds - The kinds of library that count.
 * @returns Whether every one of them hands off.
 */
const isEveryLibraryHandedOff = (
  libraries: readonly Pick<Library, 'kind' | 'takesRequests' | 'fulfilment'>[],
  kinds: readonly LibraryKind[],
): boolean => {
  const asked = libraries.filter(
    (library) => library.takesRequests && kinds.includes(library.kind),
  );

  return (
    asked.length > 0 &&
    asked.every((library) => library.fulfilment !== null && library.fulfilment !== undefined)
  );
};

export { isEveryLibraryHandedOff };
