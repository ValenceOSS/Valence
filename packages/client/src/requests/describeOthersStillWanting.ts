import type { Me } from '@ValenceContracts/functions/isMyAsk';
import { sayCount } from '@ValenceI18n/sayCount';
import { othersAskingOf } from '@ValenceClient/requests/othersAskingOf';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * What cancelling a request leaves behind when others asked for it too: that it stays requested for
 * them, named — or nothing, where whoever is cancelling is the only one who asked, and it goes.
 *
 * @param askers - Everybody who asked, the first first.
 * @param me - Whoever is cancelling, as their account and profile.
 * @returns What to say, or null.
 */
const describeOthersStillWanting = (askers: readonly Requester[], me: Me | null): string | null => {
  const others = othersAskingOf(askers, me);

  return others === null
    ? null
    : sayCount('common.othersStillWantIt', others.count, { names: others.names });
};

export { describeOthersStillWanting };
