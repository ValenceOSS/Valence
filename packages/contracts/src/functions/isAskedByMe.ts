import { askersOf } from '@ValenceContracts/functions/askersOf';
import { isMyAsk } from '@ValenceContracts/functions/isMyAsk';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether the person looking asked for a request themselves — their own profile, not only somebody
 * else on their account — which is what lets them withdraw from it.
 *
 * @param request - The request.
 * @param me - Who is looking, where anybody is.
 * @returns Whether they asked for it.
 */
const isAskedByMe = (
  request: Pick<MediaRequest, 'requestedBy' | 'alsoAskedBy' | 'origin'>,
  me: Me | null,
): boolean => askersOf(request).some((asker) => isMyAsk(asker, me));

export { isAskedByMe };
