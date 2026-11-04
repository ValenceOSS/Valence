import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitlePageSchema } from '@ValenceContracts/schemas/TitleList';
import { searchOfTitleList } from './searchOfTitleList';
import type { TitlePage } from '@ValenceContracts/schemas/TitleList';
import type { TitleListAsk } from './TitleListAsk.types';

/**
 * Reads a page of a library's titles, searched, filtered and put in order on the server.
 *
 * @param asked - The library, order, search, quick filter and filter chips.
 * @param after - Where the last page stopped, or nothing for the first page.
 * @returns The page.
 */
const fetchTitlePage = (asked: TitleListAsk, after?: string): Promise<TitlePage> =>
  readFromServer(`/api/admin/titles${searchOfTitleList(asked, after)}`, TitlePageSchema);

export { fetchTitlePage };
