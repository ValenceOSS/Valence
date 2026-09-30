import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { GiveUpRulesSchema } from '@ValenceContracts/schemas/GiveUpRules';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { GiveUpRules } from '@ValenceContracts/schemas/GiveUpRules';

const RULES = '/api/admin/requests/give-up-rules';

/**
 * Reads when a download is given up on and the next best release tried.
 *
 * @returns The rules. A wait that is null never gives up.
 */
const fetchGiveUpRules = (): Promise<GiveUpRules> => readFromServer(RULES, GiveUpRulesSchema);

/**
 * Changes when a download is given up on and the next best release tried.
 *
 * @param rules - The rules, whole.
 * @returns Them as kept, or why not.
 */
const changeGiveUpRules = (rules: GiveUpRules): Promise<Sent<GiveUpRules>> =>
  sendToRequests(RULES, 'PUT', rules, async (response) =>
    GiveUpRulesSchema.parse(await response.json()),
  );

export { changeGiveUpRules, fetchGiveUpRules };
