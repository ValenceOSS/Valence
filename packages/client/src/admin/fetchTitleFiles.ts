import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleFilesSchema } from '@ValenceContracts/schemas/TitleList';
import type { TitleFiles } from '@ValenceContracts/schemas/TitleList';

/**
 * Reads every file of a film or programme, with where each is, for opening it or the rows beneath
 * it in the list.
 *
 * @param id - One file of the title, or the list's id for a programme.
 * @returns The title's files and their paths.
 */
const fetchTitleFiles = (id: string): Promise<TitleFiles> =>
  readFromServer(`/api/admin/titles/${encodeURIComponent(id)}`, TitleFilesSchema);

export { fetchTitleFiles };
