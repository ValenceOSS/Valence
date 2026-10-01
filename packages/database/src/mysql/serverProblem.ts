import { say } from '@ValenceI18n/say';
import { COLLATIONS } from './COLLATIONS';
import { flavourOfVersion } from './flavourOfVersion';

const LOWEST = { mysql: [8, 0, 21], mariadb: [10, 6, 0] } as const;

/**
 * Says what keeps a MySQL or MariaDB server from holding Valence's data: a version too old for the
 * queries Valence sends, or a database that compares text in a way that would let two names that
 * differ only by case or by a trailing space pass for one.
 *
 * @param server - What the server says about itself and about the database.
 * @param server.version - Its version, as `select version()` gives it.
 * @param server.collation - The database's collation.
 * @param server.database - The database's name.
 * @returns What is wrong, or nothing where the server will do.
 */
const serverProblem = ({
  version,
  collation,
  database,
}: {
  version: string;
  collation: string;
  database: string;
}): string | null => {
  const flavour = flavourOfVersion(version);
  const parts = (/^(\d+)\.(\d+)\.(\d+)/.exec(version) ?? []).slice(1).map(Number);
  const lowest = LOWEST[flavour];
  const first = lowest.findIndex((part, at) => (parts[at] ?? 0) !== part);
  const isOldEnough = first === -1 || (parts[first] ?? 0) > (lowest[first] ?? 0);

  if (parts.length < 3 || !isOldEnough) {
    return say('database.mysqlTooOld', { version });
  }

  const needed = COLLATIONS[flavour];

  return collation === needed
    ? null
    : say('database.wrongCollation', { database, collation, needed });
};

export { serverProblem };
