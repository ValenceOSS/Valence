import { say } from '@ValenceI18n/say';
import { dialectOfUrl } from './dialectOfUrl';
import type { Dialect } from './Dialect';

/**
 * Refuses to start a build of Valence against the other kind of database, which it would otherwise
 * try and fail at in some way far less clear than this.
 *
 * @param databaseUrl - The address it was given.
 * @param built - Which kind of database this build speaks to.
 * @throws If the address is for the other kind, or for one Valence cannot use at all.
 */
const checkDialect = (databaseUrl: string, built: Dialect): void => {
  const asked = dialectOfUrl(databaseUrl);

  if (asked !== built) {
    throw new Error(say('database.builtForAnotherDatabase', { built, asked }));
  }
};

export { checkDialect };
