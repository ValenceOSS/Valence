import type { Library } from '@ValenceContracts/schemas/Library';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

/**
 * Puts libraries in order of where they are kept — this server's own first, then each linked
 * server's together — each with the heading it falls under in a menu. Where none comes from a
 * linked server there is nothing to tell apart, so none has a heading.
 *
 * @param libraries - The libraries, in the order they are otherwise shown.
 * @param servers - The servers this one is linked with.
 * @returns Each library with its heading, this server's own first and the rest by server.
 */
const librariesByPlace = (
  libraries: readonly Library[],
  servers: readonly LinkedServerFace[],
): { library: Library; group: string | null }[] => {
  const linked = libraries.filter((library) => (library.linkedServerId ?? null) !== null);

  if (linked.length === 0) {
    return libraries.map((library) => ({ library, group: null }));
  }

  const serverIds = [...new Set(linked.map((library) => library.linkedServerId ?? ''))];

  return [
    ...libraries
      .filter((library) => (library.linkedServerId ?? null) === null)
      .map((library) => ({ library, group: say('common.thisServer') })),
    ...serverIds.flatMap((serverId) => {
      const name = servers.find((server) => server.id === serverId)?.name ?? null;

      return linked
        .filter((library) => library.linkedServerId === serverId)
        .map((library) => ({ library, group: name }));
    }),
  ];
};

export { librariesByPlace };
