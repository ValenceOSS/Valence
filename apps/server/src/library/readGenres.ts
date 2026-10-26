import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const GenresSchema = z.array(z.string());

/**
 * Reads the genres off a stored row, through a schema rather than trusting the column: whatever a
 * catalogue wrote there years ago is not something to hand a browser unchecked, and a row that no
 * longer parses is an item with no genres rather than a failed page.
 *
 * @param stored - The column as the database returned it.
 * @returns The genres, or null where the column held something else.
 */
const readGenres = (stored: JsonValue): string[] | null => {
  const parsed = GenresSchema.safeParse(stored);

  return parsed.success ? parsed.data : null;
};

export { readGenres };
