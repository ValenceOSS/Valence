import { queryOptions } from '@tanstack/react-query';
import { fetchLinkedServerFaces } from '@ValenceClient/linking/fetchLinkedServerFaces';
import { fetchAskableElsewhere } from '@ValenceClient/linking/fetchAskableElsewhere';
import { fetchThisServerFace } from '@ValenceClient/linking/fetchThisServerFace';

const LINKING = ['linking'] as const;

/**
 * The servers this one is linked with, as anybody here sees them.
 *
 * @returns The query.
 */
const faces = () =>
  queryOptions({
    queryKey: [...LINKING, 'faces'],
    queryFn: () => fetchLinkedServerFaces(),
    staleTime: 60_000,
  });

/**
 * How this server is shown beside the servers it is linked with.
 *
 * @returns The query.
 */
const here = () =>
  queryOptions({
    queryKey: [...LINKING, 'here'],
    queryFn: () => fetchThisServerFace(),
    staleTime: 60_000,
  });

/**
 * People from linked servers who can be asked along to a party.
 *
 * @returns The query.
 */
const askableElsewhere = () =>
  queryOptions({
    queryKey: [...LINKING, 'askableElsewhere'],
    queryFn: () => fetchAskableElsewhere(),
    staleTime: 60_000,
  });

const linkingQueries = { askableElsewhere, faces, here };

export { linkingQueries };
