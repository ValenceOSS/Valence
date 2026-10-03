import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { linkingQueries } from '@ValenceClient/query/linkingQueries';
import type { LinkedServerFace } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

/**
 * Where anything in a library comes from, where that is another server: that server's name, colour
 * and initial, what to call where it comes from, and whether it can be reached. This server's own
 * libraries come from nowhere else, so they answer nothing, and a page draws them as it always has.
 *
 * @returns A reader of a library's origin, by its id.
 */
const useOriginOf = () => {
  const libraries = useQuery(libraryQueries.all());
  const faces = useQuery(linkingQueries.faces());

  return (libraryId: string): (LinkedServerFace & { initial: string; label: string }) | null => {
    const serverId = libraries.data?.find((library) => library.id === libraryId)?.linkedServerId;
    const face =
      serverId === null || serverId === undefined
        ? undefined
        : faces.data?.find((server) => server.id === serverId);

    return face === undefined
      ? null
      : {
          ...face,
          initial: face.name.trim().slice(0, 1).toUpperCase(),
          label: say('common.fromName', { name: face.name }),
        };
  };
};

export { useOriginOf };
