import { describeAdvisory } from '@ValenceClient/library/describeAdvisory';
import type { Advisory } from '@ValenceContracts/schemas/Advisory';
import { say } from '@ValenceI18n/say';

/**
 * Says in one line what a title contains, the way streaming services show it beneath the rating:
 * each in lower case, as part of the sentence, listed with commas and an "and".
 *
 * @param advisories - What it contains.
 * @returns The line, or null where it contains nothing worth saying.
 */
const sayContains = (advisories: readonly Advisory[] | null | undefined): string | null =>
  advisories === null || advisories === undefined || advisories.length === 0
    ? null
    : say('client.library.describeAdvisory.contains', {
        advisories: new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' }).format(
          advisories
            .map(describeAdvisory)
            .map((named) => `${named.charAt(0).toLocaleLowerCase()}${named.slice(1)}`),
        ),
      });

export { sayContains };
