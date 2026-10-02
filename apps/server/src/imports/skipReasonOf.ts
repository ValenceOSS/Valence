import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import type { ImportRunOptions } from './ImportRecords';
import type { SourceUser } from './SourceReader';

/**
 * Why somebody on the source is left out of an import, where they are.
 *
 * @param user - The person.
 * @param options - Who the administrator chose to leave out.
 * @returns Why they are left out, or null where they come across.
 */
const skipReasonOf = (
  user: SourceUser,
  options: Pick<ImportRunOptions, 'skipUserIds'>,
): Said | null => {
  if (options.skipUserIds.includes(user.id)) {
    return saying('server.imports.skipReasonOf.youLeftThemOut');
  }

  if (user.access === 'needsPin') {
    return saying('server.imports.skipReasonOf.theirPinWasNotGiven');
  }

  return null;
};

export { skipReasonOf };
