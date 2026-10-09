import { libraryOptionsFor } from '@ValenceClient/library/libraryOptionsFor';
import type { NavBarChoices } from '@ValenceUI/NavBar.types';
import type { Library, LibraryKind } from '@ValenceContracts/schemas/Library';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

const EVERY = 'all';

const PLACES = [
  {
    place: 'films',
    kinds: ['movies'],
    everyLabel: say('screens.library.libraryChoicesFor.allFilmLibraries'),
    label: say('screens.library.libraryChoicesFor.filmLibrary'),
  },
  {
    place: 'shows',
    kinds: ['shows', 'anime'],
    everyLabel: say('screens.library.libraryChoicesFor.allProgrammeLibraries'),
    label: say('screens.library.libraryChoicesFor.programmeLibrary'),
  },
  {
    place: 'read',
    kinds: ['books'],
    everyLabel: say('screens.library.libraryChoicesFor.allBookLibraries'),
    label: say('screens.library.libraryChoicesFor.bookLibrary'),
  },
] as const satisfies readonly {
  place: 'films' | 'shows' | 'read';
  kinds: readonly LibraryKind[];
  everyLabel: string;
  label: string;
}[];

/**
 * Works out, for films, programmes and books, the choice between the libraries that hold them —
 * offered only where there is more than one library to choose between. Where some of them come from
 * linked servers, the choice also says where: everything, only this server's own, or only one linked
 * server's; and each linked library is named with the server it comes from, after this server's own.
 *
 * @param libraries - Every library there is.
 * @param servers - The servers this one is linked with.
 * @param selectedId - The library the address names, or null for all of them.
 * @param onSelect - Told which library was chosen, or null for all of them, and the place it was
 *   chosen for — which is where choosing one takes you, from anywhere.
 * @returns A choice for each place that has several libraries.
 */
const libraryChoicesFor = (
  libraries: readonly Library[],
  servers: readonly LinkedServerFace[],
  selectedId: string | null,
  onSelect: (libraryId: string | null, place: 'films' | 'shows' | 'read') => void,
): Partial<Record<'films' | 'shows' | 'read', NavBarChoices>> =>
  Object.fromEntries(
    PLACES.flatMap(({ place, kinds, everyLabel, label }) => {
      const held = libraries.filter((library) => kinds.some((kind) => kind === library.kind));

      if (held.length < 2) {
        return [];
      }

      const options = libraryOptionsFor(held, servers, EVERY, everyLabel);

      return [
        [
          place,
          {
            label,
            options,
            selectedId: options.some((option) => option.id === selectedId)
              ? (selectedId ?? EVERY)
              : EVERY,
            onSelect: (id: string) => {
              onSelect(id === EVERY ? null : id, place);
            },
          },
        ],
      ];
    }),
  );

export { libraryChoicesFor };
