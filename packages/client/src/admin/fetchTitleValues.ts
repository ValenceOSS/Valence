import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TitleValuesSchema } from '@ValenceContracts/schemas/TitleList';
import type { TitleValueField, TitleValues } from '@ValenceContracts/schemas/TitleList';

/**
 * Reads the words in use in one field of a library's titles, with how many titles use each, for
 * suggesting them as one is typed.
 *
 * @param field - The field, such as the tags.
 * @param libraryId - The library, or every one where none is named.
 * @returns The words, most used first.
 */
const fetchTitleValues = (field: TitleValueField, libraryId?: string): Promise<TitleValues> => {
  const query = `?${new URLSearchParams(libraryId === undefined ? { field } : { field, libraryId }).toString()}`;

  return readFromServer(`/api/admin/titles/values${query}`, TitleValuesSchema);
};

export { fetchTitleValues };
