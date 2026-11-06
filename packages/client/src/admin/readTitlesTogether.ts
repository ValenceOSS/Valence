import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { BulkTitleFieldsSchema } from '@ValenceContracts/schemas/BulkTitleEdit';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type {
  BulkTitleFields,
  BulkTitleReadRequest,
} from '@ValenceContracts/schemas/BulkTitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Reads how the fields of many titles stand together, each field's shared value or that they
 * differ, for editing them all at once.
 *
 * @param request - The titles, and whether their episodes are being read instead.
 * @returns How many titles, and each field's shared state.
 * @throws With the server's words where it would not read them.
 */
const readTitlesTogether = async (request: BulkTitleReadRequest): Promise<BulkTitleFields> =>
  BulkTitleFieldsSchema.parse(
    await changeOnServer(
      '/api/admin/titles/bulk/read',
      { method: 'POST', json: JsonValueSchema.parse(request) },
      say('client.admin.readTitlesTogether.theTitlesCouldNotBeRead'),
    ),
  );

export { readTitlesTogether };
