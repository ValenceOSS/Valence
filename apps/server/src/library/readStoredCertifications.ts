import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const StoredCertificationsSchema = z.record(z.string(), z.string());

/**
 * Reads the certificates off a stored row, through a schema rather than trusting the column.
 *
 * The same care the genres are read with, and for the same reason: whatever a catalogue wrote there
 * is not something to decide a child's viewing on unchecked, and a row that no longer parses is an
 * item with no certificate rather than a failed page. An item with no certificate is unrated, which
 * is a case the ceiling already has to handle deliberately.
 *
 * @param stored - The column as the database returned it.
 * @returns The certificate per country, or nothing where the column held something else.
 */
const readStoredCertifications = (stored: JsonValue): Record<string, string> | null => {
  const parsed = StoredCertificationsSchema.safeParse(stored);

  return parsed.success ? parsed.data : null;
};

export { readStoredCertifications };
