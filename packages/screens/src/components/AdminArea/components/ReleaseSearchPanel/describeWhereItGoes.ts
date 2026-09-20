import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';

/**
 * Says where a release sent by hand ends up: a film or series is filed into the first library of
 * its kind once it has downloaded, and anything else stays in the client under its category.
 *
 * @param kind - What it is sent as.
 * @param libraries - The libraries there are.
 * @param category - The client's category for that kind.
 * @returns The words.
 */
const describeWhereItGoes = (
  kind: LibraryKind,
  libraries: readonly Pick<Library, 'kind' | 'name'>[],
  category: string,
): string => {
  const { one } = LIBRARY_KIND_NAMES[kind];

  if (kind !== 'movies' && kind !== 'shows') {
    return `As ${one}, kept in the client under ${category}.`;
  }

  const into = libraries.find((library) => library.kind === kind);

  return into === undefined
    ? `As ${one}. There is no library of ${LIBRARY_KIND_NAMES[kind].label.toLowerCase()} to file it into, so it stays in the client under ${category}.`
    : `As ${one}, filed into ${into.name} once it has downloaded.`;
};

export { describeWhereItGoes };
