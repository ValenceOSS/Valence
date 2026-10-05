import { z } from 'zod';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const UNKNOWN_ADDRESS = 'error.common.thisServerDoesNotHaveThatAddress';

const NOT_FOUND = 404;

const CodedSchema = z.object({ code: z.string().nullish() });

/**
 * Whether a failed answer means the server doesn't have the address at all, rather than that the
 * thing asked for is missing. A newer server says so with a refusal code. An older one answers an
 * address it doesn't have with a plain-text 404, while every route it does have refuses in JSON, so
 * a 404 with no JSON body is the same answer from before the code existed.
 *
 * @param status - The answer's status.
 * @param body - Its body as JSON, or undefined where it was not JSON.
 * @returns True when the app is asking for something this server doesn't have.
 */
const isUnknownToServer = (status: number, body: JsonValue | undefined): boolean => {
  if (status !== NOT_FOUND) {
    return false;
  }

  if (body === undefined) {
    return true;
  }

  const coded = CodedSchema.safeParse(body);

  return coded.success && coded.data.code === UNKNOWN_ADDRESS;
};

export { isUnknownToServer };
