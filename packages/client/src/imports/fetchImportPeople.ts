import { MediaImportPeopleSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportPerson } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Reads the people on a source and whether their watching can be read.
 *
 * @param sourceId - The source.
 * @returns The answer, or why it was refused.
 */
const fetchImportPeople = (sourceId: string): Promise<Answer<{ people: MediaImportPerson[] }>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/people`,
    { method: 'GET' },
    MediaImportPeopleSchema,
  );

export { fetchImportPeople };
