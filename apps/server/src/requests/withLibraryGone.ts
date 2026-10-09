import { saying } from '@ValenceI18n/saying';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const SETTLED = new Set<MediaRequest['state']>(['available', 'refused']);

/**
 * Requests as the server shows them, with any still open whose library has since been removed
 * marked failed, saying so, rather than left to wait for a library that will never take them.
 *
 * @param requests - The requests.
 * @param libraryIds - The ids of the libraries there are.
 * @returns The requests.
 */
const withLibraryGone = (
  requests: readonly MediaRequest[],
  libraryIds: ReadonlySet<string>,
): MediaRequest[] =>
  requests.map((request) =>
    libraryIds.has(request.libraryId) || SETTLED.has(request.state)
      ? request
      : {
          ...request,
          state: 'failed',
          problem: saying('server.requests.noLibraryToPutThisIn'),
          problemCode: null,
        },
  );

export { withLibraryGone };
