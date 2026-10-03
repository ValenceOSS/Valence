import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { LeftOutChangeSchema } from '@ValenceContracts/schemas/LeftOut';
import type { LeftOutChange } from '@ValenceContracts/schemas/LeftOut';
import { say } from '@ValenceI18n/say';

/**
 * Brings a file or folder that was left out of a library back into its scans.
 *
 * @param libraryId - The library it is in.
 * @param leftOutId - Which left-out entry to forget.
 * @returns What was brought back, and the scan reading it again.
 */
const bringBack = async (libraryId: string, leftOutId: string): Promise<LeftOutChange> =>
  LeftOutChangeSchema.parse(
    await changeOnServer(
      `/api/libraries/${libraryId}/left-out/${leftOutId}`,
      { method: 'DELETE' },
      say('common.thatCouldNotBeSaved'),
    ),
  );

export { bringBack };
