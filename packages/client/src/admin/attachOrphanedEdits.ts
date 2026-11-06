import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { OrphanOutcomeSchema } from '@ValenceContracts/schemas/OrphanedEdits';
import type { AttachOrphanRequest, OrphanOutcome } from '@ValenceContracts/schemas/OrphanedEdits';
import { say } from '@ValenceI18n/say';

/**
 * Moves the edits of a title that has gone onto one still there.
 *
 * @param request - The library, the gone title's key, and the title to move them to.
 * @returns How many edits moved.
 * @throws With the server's words where it would not move them.
 */
const attachOrphanedEdits = async (request: AttachOrphanRequest): Promise<OrphanOutcome> =>
  OrphanOutcomeSchema.parse(
    await changeOnServer(
      '/api/admin/titles/orphans/attach',
      { method: 'POST', json: request },
      say('client.admin.fetchCorrections.thatCouldNotBeChanged'),
    ),
  );

export { attachOrphanedEdits };
