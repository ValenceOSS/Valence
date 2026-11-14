import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { MediaOriginsSchema } from '@ValenceContracts/schemas/MediaOrigin';
import type { MediaOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import { say } from '@ValenceI18n/say';

const MOST_AT_ONCE = 500;

/**
 * Reads where each of some library files came from and whether it is linked to a download now,
 * asking a few hundred at a time.
 *
 * @param paths - The files.
 * @returns Where each came from, by its path.
 */
const fetchMediaOrigins = async (
  paths: readonly string[],
): Promise<Record<string, MediaOrigin>> => {
  const answers = await Promise.all(
    Array.from(
      { length: Math.ceil(paths.length / MOST_AT_ONCE) },
      async (_, at) =>
        MediaOriginsSchema.parse(
          await changeOnServer(
            '/api/admin/files/origins',
            {
              method: 'POST',
              json: { paths: paths.slice(at * MOST_AT_ONCE, (at + 1) * MOST_AT_ONCE) },
            },
            say('client.admin.fetchMediaOrigins.whereTheFilesCameFromCouldNot'),
          ),
        ).origins,
    ),
  );

  return Object.fromEntries(answers.flatMap((some) => Object.entries(some)));
};

export { fetchMediaOrigins };
