import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

/**
 * Says where a release sent by hand ends up: filed into the first library of its kind once it has
 * downloaded, or kept in the client under its category where there is no such library.
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
  const one = say(LIBRARY_KIND_NAMES[kind].oneKey);

  const into = libraries.find((library) => library.kind === kind);

  return into === undefined
    ? say('admin.describeWhereItGoes.noLibrary', {
        kind: one,
        kinds: say(LIBRARY_KIND_NAMES[kind].labelKey).toLowerCase(),
        category,
      })
    : say('admin.describeWhereItGoes.filedInto', { kind: one, library: into.name });
};

export { describeWhereItGoes };
