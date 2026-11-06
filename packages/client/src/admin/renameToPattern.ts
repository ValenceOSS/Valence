import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { PatternRenameResultSchema } from '@ValenceContracts/schemas/PatternRename';
import type { PatternRenameResult } from '@ValenceContracts/schemas/PatternRename';
import { say } from '@ValenceI18n/say';

/**
 * Renames files to their library's naming pattern.
 *
 * @param mediaIds - The files.
 * @param whenTaken - What to do where something else has a file's new name: leave the file, or
 *   give it the next free number.
 * @returns How many were renamed and left, and the job reading them again.
 */
const renameToPattern = async (
  mediaIds: readonly string[],
  whenTaken: 'skip' | 'number',
): Promise<PatternRenameResult> =>
  PatternRenameResultSchema.parse(
    await changeOnServer(
      '/api/media/rename',
      { method: 'POST', json: { mediaIds: [...mediaIds], whenTaken } },
      say('common.theServerCouldNotBeReached'),
    ),
  );

export { renameToPattern };
