import { SongRulesSchema } from '@ValenceContracts/schemas/SmartRules';
import { songRuleOf } from './songRuleOf';
import type { SongRules } from '@ValenceContracts/schemas/SmartRules';
import type { SmartDraft } from './SmartDraft';

/**
 * The rules a smart playlist being edited says, where every one of them is complete.
 *
 * @param draft - The rules as they are being edited.
 * @returns The rules, or nothing where one is unfinished or the limit is not a whole number.
 */
const songRulesOf = (draft: SmartDraft): SongRules | null => {
  const rules = draft.rules.map(songRuleOf);

  if (rules.includes(null)) {
    return null;
  }

  const parsed = SongRulesSchema.safeParse({
    rules,
    order: draft.order,
    limit: draft.limit.trim() === '' ? null : Number(draft.limit),
  });

  return parsed.success ? parsed.data : null;
};

export { songRulesOf };
