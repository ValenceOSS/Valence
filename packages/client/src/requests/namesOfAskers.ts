import type { Me } from '@ValenceContracts/functions/isMyAsk';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Everybody who asked for something, named together, the first asker first.
 *
 * @param request - The request.
 * @returns Their names.
 */
const namesOfAskers = (
  request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy'>,
  me: Me | null = null,
): string => {
  const names: [string, ...string[]] = [
    nameOfAskerFor(request.requestedBy, me),
    ...request.alsoAskedBy.map((asker) => nameOfAskerFor(asker, me)),
  ];

  return sayAgain(sayingAll(names));
};

export { namesOfAskers };
