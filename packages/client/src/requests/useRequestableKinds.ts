import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The kinds of title that can be asked for on this server: those a library of their kind takes
 * requests for, and none while requesting is off or not yet known.
 *
 * @returns The kinds.
 */
const useRequestableKinds = (): ReadonlySet<MediaRequestKind> => {
  const requesting = useQuery(requestsQueries.availability());
  const kinds = requesting.data?.isEnabled === true ? requesting.data.kinds : undefined;

  return useMemo(() => new Set(kinds ?? []), [kinds]);
};

export { useRequestableKinds };
