import { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { isUnknownToServer } from '@ValenceClient/query/isUnknownToServer';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';

type Refusal = { message: string } | null;

/**
 * Reads why the server refused, where it did, so a form can say what was wrong rather than that
 * something was. Answers with nothing for a request that succeeded, which is what makes it safe to
 * call on every response.
 *
 * @param response - The answer to an administrative request.
 * @returns The server's own words where it gave any, or null when it did not refuse at all.
 */
const readRefusal = async (response: Response): Promise<Refusal> => {
  if (response.ok) {
    return null;
  }

  const body = await response
    .json()
    .then((value) => JsonValueSchema.parse(value))
    .catch(() => undefined);

  if (isUnknownToServer(response.status, body)) {
    return { message: say('client.query.thisAppIsNewerThanTheServer') };
  }

  const refused = z.object({ error: z.string() }).safeParse(body);

  return {
    message: refused.success
      ? refused.data.error
      : say('client.admin.readRefusal.thatCouldNotBeDoneTry'),
  };
};

export type { Refusal };

export { readRefusal };
