import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { PatternRenamePlanSchema } from '@ValenceContracts/schemas/PatternRename';
import type { PatternRenamePlan } from '@ValenceContracts/schemas/PatternRename';
import { say } from '@ValenceI18n/say';

/**
 * Asks where each file would go under its library's naming pattern, changing nothing.
 *
 * @param mediaIds - The files.
 * @returns Each file's path now and under the pattern, and whether it can move there.
 */
const planPatternRenames = async (mediaIds: readonly string[]): Promise<PatternRenamePlan> =>
  PatternRenamePlanSchema.parse(
    await changeOnServer(
      '/api/media/rename-plan',
      { method: 'POST', json: { mediaIds: [...mediaIds] } },
      say('common.theServerCouldNotBeReached'),
    ),
  );

export { planPatternRenames };
