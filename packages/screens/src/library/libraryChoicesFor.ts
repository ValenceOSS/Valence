import type { NavBarChoices } from '@ValenceUI/NavBar.types';
import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';
import type { StringKey } from '@ValenceI18n/StringKey';
import { say } from '@ValenceI18n/say';

const EVERY = 'all';

const PLACES = [
  {
    place: 'films',
    kind: 'movies',
    everyLabel: 'screens.libraryChoicesFor.allFilms',
    label: 'screens.libraryChoicesFor.film',
  },
  {
    place: 'shows',
    kind: 'shows',
    everyLabel: 'screens.libraryChoicesFor.allProgrammes',
    label: 'screens.libraryChoicesFor.programme',
  },
  {
    place: 'read',
    kind: 'books',
    everyLabel: 'screens.libraryChoicesFor.allBooks',
    label: 'screens.libraryChoicesFor.book',
  },
] as const satisfies readonly {
  place: 'films' | 'shows' | 'read';
  kind: LibraryKind;
  everyLabel: StringKey;
  label: StringKey;
}[];

/**
 * Works out, for films, programmes and books, the choice between the libraries that hold them —
 * offered only where there is more than one library to choose between.
 *
 * @param libraries - Every library there is.
 * @param selectedId - The library the address names, or null for all of them.
 * @param onSelect - Told which library was chosen, or null for all of them, and the place it was
 *   chosen for — which is where choosing one takes you, from anywhere.
 * @returns A choice for each place that has several libraries.
 */
const libraryChoicesFor = (
  libraries: readonly Library[],
  selectedId: string | null,
  onSelect: (libraryId: string | null, place: 'films' | 'shows' | 'read') => void,
): Partial<Record<'films' | 'shows' | 'read', NavBarChoices>> =>
  Object.fromEntries(
    PLACES.flatMap(({ place, kind, everyLabel, label }) => {
      const held = libraries.filter((library) => library.kind === kind);

      if (held.length < 2) {
        return [];
      }

      const chosen = held.find((library) => library.id === selectedId);

      return [
        [
          place,
          {
            label: say(label),
            options: [
              { id: EVERY, label: say(everyLabel) },
              ...held.map((library) => ({ id: library.id, label: library.name })),
            ],
            selectedId: chosen?.id ?? EVERY,
            onSelect: (id: string) => {
              onSelect(id === EVERY ? null : id, place);
            },
          },
        ],
      ];
    }),
  );

export { libraryChoicesFor };
