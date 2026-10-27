import type { RuleDraft, SmartRuleKind } from '@ValenceClient/smart/SmartDraft';

type SmartRuleRowProps = {
  rule: RuleDraft;
  kinds: readonly SmartRuleKind[];
  genres: readonly string[];
  libraries: readonly { id: string; name: string }[];
  note: string | null;
  problem: string | null;
  onChange: (rule: RuleDraft) => void;
  onRemove: () => void;
};

export type { SmartRuleRowProps };
