import { TitleRulesSchema } from '@ValenceContracts/schemas/SmartRules';
import { titleRuleOf } from './titleRuleOf';
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { SmartDraft } from './SmartDraft';

/**
 * The rules a smart collection being edited says, where every one of them is complete.
 *
 * @param draft - The rules as they are being edited.
 * @returns The rules, or nothing where one is unfinished or the limit is not a whole number.
 */
const titleRulesOf = (draft: SmartDraft): TitleRules | null => {
  const rules = draft.rules.map(titleRuleOf);

  if (rules.includes(null)) {
    return null;
  }

  const parsed = TitleRulesSchema.safeParse({
    holds: draft.holds,
    rules,
    order: draft.order,
    limit: draft.limit.trim() === '' ? null : Number(draft.limit),
  });

  return parsed.success ? parsed.data : null;
};

export { titleRulesOf };
