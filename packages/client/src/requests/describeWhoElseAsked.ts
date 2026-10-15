import { isMyAsk } from '@ValenceContracts/functions/isMyAsk';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { othersAskingOf } from '@ValenceClient/requests/othersAskingOf';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Who else asked for a title, said on its page for whoever is looking: those who want it too, where
 * they asked for it themselves, or those who asked, where they did not — and nothing where nobody
 * else did.
 *
 * @param askers - Everybody who asked, the first first.
 * @param me - Whoever is looking, as their account and profile.
 * @returns What to say, or null.
 */
const describeWhoElseAsked = (askers: readonly Requester[], me: Me | null): string | null => {
  const others = othersAskingOf(askers, me);

  if (others === null) {
    return null;
  }

  return askers.some((asker) => isMyAsk(asker, me))
    ? sayCount('common.namesWantItToo', others.count, { names: others.names })
    : say('common.askedByName', { name: others.names });
};

export { describeWhoElseAsked };
