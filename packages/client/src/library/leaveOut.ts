import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { LeftOutChangeSchema } from '@ValenceContracts/schemas/LeftOut';
import type { LeftOutChange } from '@ValenceContracts/schemas/LeftOut';
import { say } from '@ValenceI18n/say';

/**
 * Leaves a file or folder out of a library, so its scans pass over it and what was found there
 * goes at the next one.
 *
 * @param libraryId - The library it is in.
 * @param path - The file or folder, as the server sees it.
 * @param note - Why, in the administrator's words, or nothing.
 * @returns What is now left out, and the scan taking it away.
 */
const leaveOut = async (
  libraryId: string,
  path: string,
  note: string | null,
): Promise<LeftOutChange> =>
  LeftOutChangeSchema.parse(
    await changeOnServer(
      `/api/libraries/${libraryId}/left-out`,
      { method: 'POST', json: { path, note } },
      say('common.thatCouldNotBeSaved'),
    ),
  );

export { leaveOut };
