import { TitleRuleSchema } from '@ValenceContracts/schemas/SmartRules';
import { ruleOfDraft } from './ruleOfDraft';
import type { TitleRule } from '@ValenceContracts/schemas/SmartRules';
import type { RuleDraft } from './SmartDraft';

/**
 * The film and programme rule a draft says, where it is complete and a smart collection may hold it.
 *
 * @param draft - The rule as it is being edited.
 * @returns The rule, or nothing where it is unfinished, out of range or not about films.
 */
const titleRuleOf = (draft: RuleDraft): TitleRule | null => {
  const parsed = TitleRuleSchema.safeParse(ruleOfDraft(draft));

  return parsed.success ? parsed.data : null;
};

export { titleRuleOf };
