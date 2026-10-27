import { SongRuleSchema } from '@ValenceContracts/schemas/SmartRules';
import { ruleOfDraft } from './ruleOfDraft';
import type { SongRule } from '@ValenceContracts/schemas/SmartRules';
import type { RuleDraft } from './SmartDraft';

/**
 * The song rule a draft says, where it is complete and a smart playlist may hold it.
 *
 * @param draft - The rule as it is being edited.
 * @returns The rule, or nothing where it is unfinished, out of range or not about songs.
 */
const songRuleOf = (draft: RuleDraft): SongRule | null => {
  const parsed = SongRuleSchema.safeParse(ruleOfDraft(draft));

  return parsed.success ? parsed.data : null;
};

export { songRuleOf };
