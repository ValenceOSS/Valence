import { ImportedSetupLinksSchema } from '@ValenceContracts/schemas/MediaImport';
import type { ImportedSetupLinks } from '@ValenceContracts/schemas/MediaImport';
import type { SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Makes a setup link for everybody an import added, each working for as long as asked.
 *
 * @param runId - The import.
 * @param lifetimeDays - How many days each link works for.
 * @returns The answer, or why it was refused.
 */
const makeImportSetupLinks = (
  runId: string,
  lifetimeDays: SetupLinkLifetime,
): Promise<Answer<ImportedSetupLinks>> =>
  sendToServer(
    `/api/admin/imports/runs/${encodeURIComponent(runId)}/setup-links`,
    { method: 'POST', body: { lifetimeDays } },
    ImportedSetupLinksSchema,
  );

export { makeImportSetupLinks };
