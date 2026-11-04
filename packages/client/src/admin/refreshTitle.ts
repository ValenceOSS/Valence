import { sendTitleWork } from '@ValenceClient/admin/sendTitleWork';
import type { TitleWorkAnswer } from '@ValenceClient/admin/sendTitleWork';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';

type RefreshMode = 'details' | 'fields' | 'matchAgain' | 'artwork';

/**
 * Asks the catalogue again for a title: its details keeping its match and edits, some fields of it,
 * a new match from its name, or its artwork fetched afresh.
 *
 * @param mediaId - A file of the title.
 * @param mode - What to ask for again.
 * @param fields - The fields, where only some are asked for.
 * @returns How many files or fields it reached and the job doing the work, or why it was refused.
 */
const refreshTitle = (
  mediaId: string,
  mode: RefreshMode,
  fields: readonly TitleField[] = [],
): Promise<TitleWorkAnswer> =>
  sendTitleWork(`/api/media/${mediaId}/refresh`, mode === 'fields' ? { mode, fields } : { mode });

export type { RefreshMode };

export { refreshTitle };
