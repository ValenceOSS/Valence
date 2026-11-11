import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { PersonCredit } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says how somebody is credited on a title, leaving out what the catalogue does not know.
 *
 * @param credit - The credit.
 * @returns The line under its title, or nothing where the catalogue gives neither.
 */
const describeCredit = (credit: PersonCredit): string | undefined => {
  const episodes =
    credit.kind !== 'series' || credit.episodeCount === null
      ? null
      : sayCount('common.count.episodes', credit.episodeCount);

  if (credit.role === null) {
    return episodes ?? undefined;
  }

  return episodes === null
    ? say('screens.personDialog.asRole', { role: credit.role })
    : say('screens.personDialog.creditEpisodes', { episodes, role: credit.role });
};

export { describeCredit };
