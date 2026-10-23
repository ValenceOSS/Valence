import { and, asc, eq, inArray } from 'drizzle-orm';
import { mediaPart } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaPart } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * How the parts of films kept as several files are found from the paths of their first parts, in
 * one reading however many paths are asked about, since a sweep asks about every file a library
 * holds.
 *
 * One path is looked up by its index, which is every request but a sweep. For more, every first
 * part is read and matched here rather than the paths being sent to the database: films kept as
 * several files are few, and a library's paths are too many for one query to name.
 * A path two libraries both hold — one library inside another — answers with one film's parts, so
 * the film is never joined to a second copy of itself.
 *
 * @param db - The database.
 * @returns The parts of each film a path is the first part of, in order, by that path.
 */
const createPartsOfMany =
  (db: AnyValenceDatabase) =>
  async (paths: readonly string[]): Promise<ReadonlyMap<string, readonly MediaPart[]>> => {
    const asked = new Set(paths);

    if (asked.size === 0) {
      return new Map();
    }

    const [only] = asked;
    const firsts = await db
      .select({ id: mediaPart.mediaItemId, path: mediaPart.path })
      .from(mediaPart)
      .where(
        asked.size === 1 && only !== undefined
          ? and(eq(mediaPart.position, 1), eq(mediaPart.path, only))
          : eq(mediaPart.position, 1),
      )
      .orderBy(asc(mediaPart.mediaItemId));
    const filmOf = new Map<string, string>();

    for (const first of firsts) {
      if (asked.has(first.path) && !filmOf.has(first.path)) {
        filmOf.set(first.path, first.id);
      }
    }

    if (filmOf.size === 0) {
      return new Map();
    }

    const rows = await db
      .select({
        id: mediaPart.mediaItemId,
        path: mediaPart.path,
        durationSeconds: mediaPart.durationSeconds,
      })
      .from(mediaPart)
      .where(inArray(mediaPart.mediaItemId, [...new Set(filmOf.values())]))
      .orderBy(asc(mediaPart.mediaItemId), asc(mediaPart.position));
    const partsOf = new Map<string, MediaPart[]>();

    for (const { id, ...part } of rows) {
      partsOf.set(id, [...(partsOf.get(id) ?? []), part]);
    }

    return new Map(
      [...filmOf].flatMap(([path, id]) => {
        const parts = partsOf.get(id) ?? [];

        return parts.length > 1 ? [[path, parts] as const] : [];
      }),
    );
  };

export { createPartsOfMany };
