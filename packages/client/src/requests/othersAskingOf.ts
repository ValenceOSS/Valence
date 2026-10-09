import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

type OthersAsking = { names: string; count: number };

/**
 * Who else asked for something whoever is looking asked for, named together and counted — or
 * nothing, where nobody else did.
 *
 * @param askers - Everybody who asked, the first first.
 * @param meId - Whoever is looking, by their account.
 * @returns Their names and how many, or null.
 */
const othersAskingOf = (
  askers: readonly Requester[],
  meId: string | null | undefined,
): OthersAsking | null => {
  const [first, ...rest] = askers.filter((asker) => asker.id !== meId).map((asker) => asker.name);

  return first === undefined
    ? null
    : { names: sayAgain(sayingAll([first, ...rest])), count: rest.length + 1 };
};

export type { OthersAsking };

export { othersAskingOf };
