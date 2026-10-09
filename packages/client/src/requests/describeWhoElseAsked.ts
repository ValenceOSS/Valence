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
 * @param meId - Whoever is looking, by their account.
 * @returns What to say, or null.
 */
const describeWhoElseAsked = (
  askers: readonly Requester[],
  meId: string | null | undefined,
): string | null => {
  const others = othersAskingOf(askers, meId);

  if (others === null) {
    return null;
  }

  return askers.some((asker) => asker.id === meId)
    ? sayCount('common.namesWantItToo', others.count, { names: others.names })
    : say('common.askedByName', { name: others.names });
};

export { describeWhoElseAsked };
