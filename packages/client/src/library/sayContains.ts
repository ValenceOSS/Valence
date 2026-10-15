import { describeAdvisory } from '@ValenceClient/library/describeAdvisory';
import type { Advisory } from '@ValenceContracts/schemas/Advisory';
import { say } from '@ValenceI18n/say';

/**
 * Says in one line what a title contains, the way streaming services show it beside the rating.
 *
 * @param advisories - What it contains.
 * @returns The line, or null where it contains nothing worth saying.
 */
const sayContains = (advisories: readonly Advisory[] | null | undefined): string | null =>
  advisories === null || advisories === undefined || advisories.length === 0
    ? null
    : say('client.library.describeAdvisory.contains', {
        advisories: new Intl.ListFormat(undefined, { style: 'narrow', type: 'unit' }).format(
          advisories.map(describeAdvisory),
        ),
      });

export { sayContains };
