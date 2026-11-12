import { WHERE_CHOICE } from './WHERE_CHOICE';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import type { LibraryOption } from './LibraryOption';
import { say } from '@ValenceI18n/say';

/**
 * The choices between some libraries, for a page that shows several: all of them, and then each
 * library. Where any come from linked servers, each server is a choice of everything it holds, this
 * server's own first, with its libraries offered beneath it, each linked one named with the server
 * it comes from. Each choice also has a shorter name, for a
 * menu that sets the libraries beneath their server rather than naming it on every line.
 *
 * @param libraries - The libraries to choose between.
 * @param servers - The servers this one is linked with.
 * @param every - The id that stands for all of them.
 * @param everyLabel - What to call all of them, where none come from elsewhere.
 * @returns The choices, in the order they are offered.
 */
const libraryOptionsFor = (
  libraries: readonly Library[],
  servers: readonly LinkedServerFace[],
  every: string,
  everyLabel: string,
): LibraryOption[] => {
  const own = libraries.filter((library) => (library.linkedServerId ?? null) === null);
  const linked = libraries.filter((library) => (library.linkedServerId ?? null) !== null);
  const nameOf = (serverId: string | null | undefined) =>
    servers.find((server) => server.id === serverId)?.name ?? null;
  const beneath = (held: readonly Library[], named: (library: Library) => string) =>
    held.map((library) => ({
      id: library.id,
      label: named(library),
      shortLabel: library.name,
      isNested: true,
    }));

  if (linked.length === 0) {
    return [
      { id: every, label: everyLabel, shortLabel: everyLabel, isNested: false },
      ...own.map((library) => ({
        id: library.id,
        label: library.name,
        shortLabel: library.name,
        isNested: false,
      })),
    ];
  }

  const elsewhere = [...new Set(linked.map((library) => library.linkedServerId))].flatMap(
    (serverId) => {
      const name = nameOf(serverId);

      return serverId === null || serverId === undefined || name === null
        ? []
        : [{ serverId, name }];
    },
  );

  return [
    {
      id: every,
      label: say('common.everywhere'),
      shortLabel: say('common.everywhere'),
      isNested: false,
    },
    ...(own.length === 0
      ? []
      : [
          {
            id: WHERE_CHOICE.here,
            label: say('common.here'),
            shortLabel: say('common.thisServer'),
            isNested: false,
          },
          ...beneath(own, (library) => library.name),
        ]),
    ...elsewhere.flatMap(({ serverId, name }) => [
      {
        id: `${WHERE_CHOICE.fromPrefix}${serverId}`,
        label: name,
        shortLabel: name,
        isNested: false,
      },
      ...beneath(
        linked.filter((library) => library.linkedServerId === serverId),
        (library) => `${library.name} · ${name}`,
      ),
    ]),
    ...linked
      .filter((library) => nameOf(library.linkedServerId) === null)
      .map((library) => ({
        id: library.id,
        label: library.name,
        shortLabel: library.name,
        isNested: false,
      })),
  ];
};

export { libraryOptionsFor };
