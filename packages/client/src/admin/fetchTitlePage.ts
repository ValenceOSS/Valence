import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
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
 * @returns The page, its posters' revisions noted so a new one is drawn at once.
 */
const fetchTitlePage = async (asked: TitleListAsk, after?: string): Promise<TitlePage> => {
  const page = await readFromServer(
    `/api/admin/titles${searchOfTitleList(asked, after)}`,
    TitlePageSchema,
  );

  artworkRevisions.learn(page.titles.map((row) => row.lead));

  return page;
};

export { fetchTitlePage };
