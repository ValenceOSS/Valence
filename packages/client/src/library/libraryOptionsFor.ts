import { WHERE_CHOICE } from './WHERE_CHOICE';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

/**
 * The choices between some libraries, for a page that shows several: all of them; where any come
 * from linked servers, only this server's own, or only one linked server's; and then each library,
 * this server's own first and each linked one named with the server it comes from.
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
): { id: string; label: string }[] => {
  const own = libraries.filter((library) => (library.linkedServerId ?? null) === null);
  const linked = libraries.filter((library) => (library.linkedServerId ?? null) !== null);
  const nameOf = (serverId: string | null | undefined) =>
    servers.find((server) => server.id === serverId)?.name ?? null;
  const wheres =
    linked.length === 0
      ? []
      : [
          { id: WHERE_CHOICE.here, label: say('common.here') },
          ...[...new Set(linked.map((library) => library.linkedServerId))].flatMap((serverId) => {
            const name = nameOf(serverId);

            return serverId === null || serverId === undefined || name === null
              ? []
              : [{ id: `${WHERE_CHOICE.fromPrefix}${serverId}`, label: name }];
          }),
        ];

  return [
    { id: every, label: wheres.length === 0 ? everyLabel : say('common.everywhere') },
    ...wheres,
    ...own.map((library) => ({ id: library.id, label: library.name })),
    ...linked.map((library) => {
      const server = nameOf(library.linkedServerId);

      return {
        id: library.id,
        label: server === null ? library.name : `${library.name} · ${server}`,
      };
    }),
  ];
};

export { libraryOptionsFor };
