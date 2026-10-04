import { z } from 'zod';

const UNKNOWN_ADDRESS = 'error.common.thisServerDoesNotHaveThatAddress';

const NOT_FOUND = 404;

const CodedSchema = z.object({ code: z.string().nullish() });

/**
 * Whether a failed response means the server doesn't have the address at all, rather than that the
 * thing asked for is missing. Newer servers say so with a refusal code. Older ones answer an unknown
 * address with a plain-text 404, while every route they do have refuses in JSON. Reads a copy of the
 * response, so the body is still there for the caller.
 *
 * @param response - The failed response.
 * @returns True when the app is asking for something this server doesn't have.
 */
const isUnknownToServer = async (response: Response): Promise<boolean> => {
  if (response.status !== NOT_FOUND) {
    return false;
  }

  const coded = await response
    .clone()
    .json()
    .then((value) => CodedSchema.safeParse(value))
    .catch(() => null);

  return coded === null || !coded.success || coded.data.code === UNKNOWN_ADDRESS;
};

export { isUnknownToServer };
