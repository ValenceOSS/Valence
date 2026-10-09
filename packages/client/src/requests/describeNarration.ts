import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Narration } from '@ValenceContracts/schemas/MediaRequest';

/**
 * One narration of an audiobook as a person reads it: who reads it, and how long it lasts where
 * that is known.
 *
 * @param narration - The narration.
 * @returns The words.
 */
const describeNarration = (narration: Pick<Narration, 'narrators' | 'runtimeMinutes'>): string => {
  const [first, ...rest] = narration.narrators;
  const narrators = first === undefined ? '' : sayAgain(sayingAll([first, ...rest]));

  return narration.runtimeMinutes === null
    ? say('client.requests.describeNarration.readByNarrators', { narrators })
    : say('client.requests.describeNarration.readByNarratorsLength', {
        narrators,
        hours: Math.floor(narration.runtimeMinutes / 60).toString(),
        minutes: (narration.runtimeMinutes % 60).toString(),
      });
};

export { describeNarration };
