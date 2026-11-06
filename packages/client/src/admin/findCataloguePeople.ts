import { readFromServer } from '@ValenceClient/query/readFromServer';
import { CataloguePeopleSchema } from '@ValenceContracts/schemas/CataloguePeople';
import type { CataloguePerson } from '@ValenceContracts/schemas/CataloguePeople';

/**
 * Finds people in the catalogue by name, for an administrator adding somebody to a title's cast.
 *
 * @param name - What was typed.
 * @returns The people found, best first, or none for an empty name.
 */
const findCataloguePeople = async (name: string): Promise<CataloguePerson[]> => {
  const looking = name.trim();

  if (looking === '') {
    return [];
  }

  return (
    await readFromServer(
      `/api/admin/titles/people?${new URLSearchParams({ name: looking }).toString()}`,
      CataloguePeopleSchema,
    )
  ).people;
};

export { findCataloguePeople };
