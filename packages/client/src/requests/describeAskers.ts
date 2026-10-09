import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Who asked for something, said for whoever is looking: by you, by you and others, or by others,
 * named.
 *
 * @param askers - Everybody who asked, the first first.
 * @param meId - Whoever is looking, by their account.
 * @returns What to say.
 */
const describeAskers = (askers: readonly Requester[], meId: string | null | undefined): string => {
  const [first, ...rest] = askers.filter((asker) => asker.id !== meId).map((asker) => asker.name);
  const isMine = askers.some((asker) => asker.id === meId);

  if (first === undefined) {
    return isMine ? say('common.askedByYou') : '';
  }

  const names = sayAgain(sayingAll([first, ...rest]));

  return isMine
    ? say('common.askedByYouAndNames', { names })
    : say('common.askedByName', { name: names });
};

export { describeAskers };
