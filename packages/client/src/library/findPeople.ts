import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PersonFoundSchema } from '@ValenceContracts/schemas/PersonFound';
import type { PersonFound } from '@ValenceContracts/schemas/PersonFound';

const PeopleFoundSchema = z.object({ people: z.array(PersonFoundSchema) });

/**
 * Finds the people in what this server holds whose names match what was typed, those in the most
 * titles here first, so typing an actor's name finds them as well as their films.
 *
 * @param search - What was typed.
 * @returns The people found, or none for an empty search.
 */
const findPeople = async (search: string): Promise<PersonFound[]> => {
  const looking = search.trim();

  if (looking === '') {
    return [];
  }

  return (
    await readFromServer(
      `/api/people?${new URLSearchParams({ search: looking }).toString()}`,
      PeopleFoundSchema,
    )
  ).people;
};

export { findPeople };
