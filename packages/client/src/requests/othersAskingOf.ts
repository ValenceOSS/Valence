import { isMyAsk } from '@ValenceContracts/functions/isMyAsk';
import type { Me } from '@ValenceContracts/functions/isMyAsk';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

type OthersAsking = { names: string; count: number };

/**
 * Who else asked for something whoever is looking asked for, named together and counted — or
 * nothing, where nobody else did.
 *
 * @param askers - Everybody who asked, the first first.
 * @param me - Whoever is looking, as their account and profile.
 * @returns Their names and how many, or null.
 */
const othersAskingOf = (askers: readonly Requester[], me: Me | null): OthersAsking | null => {
  const [first, ...rest] = askers
    .filter((asker) => !isMyAsk(asker, me))
    .map((asker) => nameOfAskerFor(asker, me));

  return first === undefined
    ? null
    : { names: sayAgain(sayingAll([first, ...rest])), count: rest.length + 1 };
};

export type { OthersAsking };

export { othersAskingOf };
