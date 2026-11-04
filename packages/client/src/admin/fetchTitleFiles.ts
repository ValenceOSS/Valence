import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleFilesSchema } from '@ValenceContracts/schemas/TitleList';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Reads every file of the film or programme one file belongs to, for opening a title straight from
 * an address.
 *
 * @param mediaId - One file of the title.
 * @returns The title's files.
 */
const fetchTitleFiles = async (mediaId: string): Promise<MediaSummary[]> =>
  (await readFromServer(`/api/admin/titles/${mediaId}`, TitleFilesSchema)).files;

export { fetchTitleFiles };
