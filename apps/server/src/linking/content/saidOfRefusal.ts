import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type { Said } from '@ValenceI18n/SaidSchema';
import { say } from '@ValenceI18n/say';

/**
 * Why a linked server refused something, in the words it gave, or that it could not be done where
 * it gave none this server can read.
 *
 * @param answered - The refusal, as it came back.
 * @returns Why.
 */
const saidOfRefusal = async (answered: Response | null): Promise<Said> => {
  const body = answered === null ? null : await answered.json().catch(() => null);
  const refusal = RefusalSchema.safeParse(body);

  return refusal.success
    ? { code: refusal.data.code, message: refusal.data.error, values: refusal.data.values }
    : {
        code: 'error.linking.thatServerCouldNotBeReached',
        message: say('error.linking.thatServerCouldNotBeReached'),
        values: {},
      };
};

export { saidOfRefusal };
