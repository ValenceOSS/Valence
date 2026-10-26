import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { sayAgain } from '@ValenceI18n/sayAgain';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Reads what a server said when it refused, in this app's own words where it knows them.
 *
 * @param body - The refusal's body as JSON, or undefined where it was not JSON.
 * @returns What the server said, or null where it said nothing a person could read.
 */
const saidInRefusal = (body: JsonValue | undefined): string | null => {
  const refused = RefusalSchema.safeParse(body);

  return refused.success
    ? sayAgain({
        code: refused.data.code,
        message: refused.data.error,
        values: refused.data.values,
      })
    : null;
};

export { saidInRefusal };
