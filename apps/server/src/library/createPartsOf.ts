import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaPart } from '@ValenceServer/transcoder/TranscoderClient';
import { createPartsOfMany } from './createPartsOfMany';

/**
 * How the parts of a film kept as several files are found from the path of its first part, which
 * is the path the film itself is stored and asked for at.
 *
 * @param db - The database.
 * @returns The parts of the film a path is the first part of, in order, or null where it is not
 *   the first part of one.
 */
const createPartsOf = (db: AnyValenceDatabase) => {
  const partsOfMany = createPartsOfMany(db);

  return async (path: string): Promise<readonly MediaPart[] | null> =>
    (await partsOfMany([path])).get(path) ?? null;
};

export { createPartsOf };
