import { WHERE_CHOICE } from './WHERE_CHOICE';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import type { LibraryOption } from './LibraryOption';
import { say } from '@ValenceI18n/say';

/**
 * The choices between some libraries, for a page that shows several: all of them; where any come
 * from linked servers, only this server's own, or only one linked server's; and then each library,
 * this server's own first and each linked one named with the server it comes from. Each choice also
 * says which server it falls under and a shorter name for it there, for a menu that heads each
 * server's choices with its name rather than repeating it on every line.
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
  const here = linked.length === 0 ? null : say('common.thisServer');
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
      label: linked.length === 0 ? everyLabel : say('common.everywhere'),
      shortLabel: linked.length === 0 ? everyLabel : say('common.everywhere'),
      group: null,
    },
    ...(here === null
      ? []
      : [
          {
            id: WHERE_CHOICE.here,
            label: say('common.here'),
            shortLabel: say('common.all'),
            group: here,
          },
        ]),
    ...own.map((library) => ({
      id: library.id,
      label: library.name,
      shortLabel: library.name,
      group: here,
    })),
    ...elsewhere.flatMap(({ serverId, name }) => [
      {
        id: `${WHERE_CHOICE.fromPrefix}${serverId}`,
        label: name,
        shortLabel: say('common.all'),
        group: name,
      },
      ...linked
        .filter((library) => library.linkedServerId === serverId)
        .map((library) => ({
          id: library.id,
          label: `${library.name} · ${name}`,
          shortLabel: library.name,
          group: name,
        })),
    ]),
    ...linked
      .filter((library) => nameOf(library.linkedServerId) === null)
      .map((library) => ({
        id: library.id,
        label: library.name,
        shortLabel: library.name,
        group: null,
      })),
  ];
};

export { libraryOptionsFor };
