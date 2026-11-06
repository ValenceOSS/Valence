import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { BulkTitleEditOutcomeSchema } from '@ValenceContracts/schemas/BulkTitleEdit';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type {
  BulkTitleEditOutcome,
  BulkTitleEditRequest,
} from '@ValenceContracts/schemas/BulkTitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Makes one change to the metadata of many titles, kept as one change set.
 *
 * @param request - The titles, whether to them or their episodes, the change, and the change set
 *   to add to where this is one part of a larger selection.
 * @returns The change set, and which titles it changed.
 * @throws With the server's words where it would not make the change.
 */
const editTitlesTogether = async (request: BulkTitleEditRequest): Promise<BulkTitleEditOutcome> =>
  BulkTitleEditOutcomeSchema.parse(
    await changeOnServer(
      '/api/admin/titles/bulk',
      { method: 'POST', json: JsonValueSchema.parse(request) },
      say('client.admin.fetchCorrections.thatCouldNotBeChanged'),
    ),
  );

export { editTitlesTogether };
