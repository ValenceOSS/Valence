import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrCaller, ArrReader } from '@ValenceRequests/arrApps/createArrCaller';

/**
 * Reads something only some versions of an app have, such as custom formats, which Sonarr 3 lacks:
 * an app that answers that it has no such thing is taken to have none of it.
 *
 * @param caller - How to ask the app.
 * @param path - What to read.
 * @param reader - How to read it.
 * @param otherwise - What it has where it has no such thing.
 * @returns What it has.
 */
const readOptional = async <Value>(
  caller: Pick<ArrCaller, 'read'>,
  path: string,
  reader: ArrReader<Value>,
  otherwise: Value,
): Promise<Value> => {
  try {
    return await caller.read(path, reader);
  } catch (error) {
    if (error instanceof ArrAppFailure && (error.status === 404 || error.status === 405)) {
      return otherwise;
    }

    throw error;
  }
};

export { readOptional };
