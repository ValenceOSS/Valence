import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';
import type { StringKey } from '@ValenceI18n/StringKey';
import { say } from '@ValenceI18n/say';

const WORDS = {
  movies: {
    filed: 'screens.releaseSearchPanel.describeWhereItGoes.asAFilmFiledIntoName',
    kept: 'screens.releaseSearchPanel.describeWhereItGoes.asAFilmNoLibrary',
  },
  shows: {
    filed: 'screens.releaseSearchPanel.describeWhereItGoes.asASeriesFiledIntoName',
    kept: 'screens.releaseSearchPanel.describeWhereItGoes.asASeriesNoLibrary',
  },
  anime: {
    filed: 'screens.releaseSearchPanel.describeWhereItGoes.asAnimeFiledIntoName',
    kept: 'screens.releaseSearchPanel.describeWhereItGoes.asAnimeNoLibrary',
  },
  music: {
    filed: 'screens.releaseSearchPanel.describeWhereItGoes.asMusicFiledIntoName',
    kept: 'screens.releaseSearchPanel.describeWhereItGoes.asMusicNoLibrary',
  },
  books: {
    filed: 'screens.releaseSearchPanel.describeWhereItGoes.asABookFiledIntoName',
    kept: 'screens.releaseSearchPanel.describeWhereItGoes.asABookNoLibrary',
  },
} as const satisfies Readonly<Record<LibraryKind, { filed: StringKey; kept: StringKey }>>;

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
  const into = libraries.find((library) => library.kind === kind);

  return into === undefined
    ? say(WORDS[kind].kept, { category })
    : say(WORDS[kind].filed, { name: into.name });
};

export { describeWhereItGoes };
