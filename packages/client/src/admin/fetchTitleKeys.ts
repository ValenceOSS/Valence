import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleKeysSchema } from '@ValenceContracts/schemas/TitleList';
import { searchOfTitleList } from './searchOfTitleList';
import type { TitleKeys } from '@ValenceContracts/schemas/TitleList';
import type { TitleListAsk } from './TitleListAsk.types';

/**
 * Names every title a listing asks for, for selecting all of them rather than the rows read so far.
 *
 * @param asked - The library, order, search, quick filter and filter chips.
 * @returns The titles.
 */
const fetchTitleKeys = (asked: TitleListAsk): Promise<TitleKeys> =>
  readFromServer(`/api/admin/titles/keys${searchOfTitleList(asked)}`, TitleKeysSchema);

export { fetchTitleKeys };
