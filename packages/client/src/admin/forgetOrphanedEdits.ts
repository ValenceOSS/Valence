import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { OrphanOutcomeSchema } from '@ValenceContracts/schemas/OrphanedEdits';
import type { ForgetOrphanRequest, OrphanOutcome } from '@ValenceContracts/schemas/OrphanedEdits';
import { say } from '@ValenceI18n/say';

/**
 * Throws away the edits of a title that has gone.
 *
 * @param request - The library, and the gone title's key.
 * @returns How many edits went.
 * @throws With the server's words where it would not throw them away.
 */
const forgetOrphanedEdits = async (request: ForgetOrphanRequest): Promise<OrphanOutcome> =>
  OrphanOutcomeSchema.parse(
    await changeOnServer(
      '/api/admin/titles/orphans/forget',
      { method: 'POST', json: request },
      say('client.admin.fetchCorrections.thatCouldNotBeChanged'),
    ),
  );

export { forgetOrphanedEdits };
