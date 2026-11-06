import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { BulkTitleUndoOutcomeSchema } from '@ValenceContracts/schemas/BulkTitleEdit';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type {
  BulkTitleUndoOutcome,
  BulkTitleUndoRequest,
} from '@ValenceContracts/schemas/BulkTitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Undoes a change made to many titles, every one of them or none.
 *
 * @param request - The change set, the titles it changed, and the change set to add the undoing to
 *   where this is one part of a larger selection.
 * @returns The undoing's change set, and how many titles it put back.
 * @throws With the server's words where it would not undo it, as when a title changed since.
 */
const undoTitlesTogether = async (request: BulkTitleUndoRequest): Promise<BulkTitleUndoOutcome> =>
  BulkTitleUndoOutcomeSchema.parse(
    await changeOnServer(
      '/api/admin/titles/bulk/undo',
      { method: 'POST', json: JsonValueSchema.parse(request) },
      say('client.admin.undoTitlesTogether.theChangeCouldNotBeUndone'),
    ),
  );

export { undoTitlesTogether };
