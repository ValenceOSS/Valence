import { isMyAsk } from '@ValenceContracts/functions/isMyAsk';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Who asked for something, said for whoever is looking: by you, by you and others, or by others,
 * named.
 *
 * @param askers - Everybody who asked, the first first.
 * @param me - Whoever is looking, as their account and profile.
 * @returns What to say.
 */
const describeAskers = (askers: readonly Requester[], me: Me | null): string => {
  const [first, ...rest] = askers
    .filter((asker) => !isMyAsk(asker, me))
    .map((asker) => nameOfAskerFor(asker, me));
  const isMine = askers.some((asker) => isMyAsk(asker, me));

  if (first === undefined) {
    return isMine ? say('common.askedByYou') : '';
  }

  const names = sayAgain(sayingAll([first, ...rest]));

  return isMine
    ? say('common.askedByYouAndNames', { names })
    : say('common.askedByName', { name: names });
};

export { describeAskers };
