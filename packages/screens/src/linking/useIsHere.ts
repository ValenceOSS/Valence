import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';

/**
 * Whether a library is this server's own: known to be here and not shared from a linked server. A
 * library not read yet, or not known at all, is not taken for this server's.
 *
 * @returns A reader of whether a library is this server's own, by its id.
 */
const useIsHere = () => {
  const libraries = useQuery(libraryQueries.all());

  return (libraryId: string): boolean => {
    const library = libraries.data?.find((one) => one.id === libraryId);

    return library !== undefined && (library.linkedServerId ?? null) === null;
  };
};

export { useIsHere };
