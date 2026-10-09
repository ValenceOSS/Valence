import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Everybody who asked for something, named together, the first asker first.
 *
 * @param request - The request.
 * @returns Their names.
 */
const namesOfAskers = (request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy'>): string =>
  sayAgain(
    sayingAll([request.requestedBy.name, ...request.alsoAskedBy.map((asker) => asker.name)]),
  );

export { namesOfAskers };
