import { eq, isNotNull } from 'drizzle-orm';
import { mediaItem } from '@ValenceServer/db/Schema';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { certificationAgeOf } from '@ValenceServer/library/certificationAgeOf';
import { readStoredCertifications } from '@ValenceServer/library/readStoredCertifications';
import type { ValenceDatabase } from '@ValenceServer/db/Database';

/**
 * Works out again what every stored certificate means, in whichever region the server now reads
 * them in.
 *
 * This is why every country's certificate is kept rather than only the one in use. A household that
 * moves from British certificates to German ones changes a setting and this runs; nothing is fetched
 * and nothing is rescanned, because the answer was already on disk. Rescanning a large library to
 * change a preference would be an afternoon's work for a question that deserves a moment.
 *
 * An item whose certificate this region never issued comes out with no age, which is unrated — the
 * honest answer rather than the old region's number left behind to be quietly wrong.
 *
 * @param db - The database.
 * @param region - The country whose certificates are now being read.
 * @param onProgress - Told how many have been done, for a job that reports itself.
 * @returns How many items were looked at, and how many ended up with an age.
 */
const readCertificatesAgain = async (
  db: ValenceDatabase,
  region: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ looked: number; rated: number }> => {
  const rows = await db
    .select({ id: mediaItem.id, certifications: mediaItem.certifications })
    .from(mediaItem)
    .where(isNotNull(mediaItem.certifications));

  let rated = 0;

  for (const [at, row] of rows.entries()) {
    const age = certificationAgeOf(
      region,
      readStoredCertifications(JsonValueSchema.parse(row.certifications ?? null)),
    );

    if (age !== null) {
      rated += 1;
    }

    await db.update(mediaItem).set({ certificationAge: age }).where(eq(mediaItem.id, row.id));

    onProgress?.(at + 1, rows.length);
  }

  return { looked: rows.length, rated };
};

export { readCertificatesAgain };
