import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dialectOfUrl } from './dialectOfUrl';

/**
 * Works out which build a launcher starts: the entry point it was itself built as, such as
 * `Main.js`, for the kind of database the address is for, as `Main.mysql.js`. Every entry point is
 * built once for each kind of database, and one small launcher in front of each picks between them.
 *
 * @param launcher - The launcher's own `import.meta.url`.
 * @param databaseUrl - The address the server was given.
 * @returns The build to import, beside the launcher.
 */
const launchPath = (launcher: string, databaseUrl: string): string =>
  `./${basename(fileURLToPath(launcher), '.js')}.${dialectOfUrl(databaseUrl)}.js`;

export { launchPath };
