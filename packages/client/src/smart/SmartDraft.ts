import type { SongRule, TitleHolds, TitleRule } from '@ValenceContracts/schemas/SmartRules';

type SmartRuleKind = SongRule['kind'] | TitleRule['kind'];

type RuleDraft = {
  key: string;
  kind: SmartRuleKind;
  choice: string;
  picked: readonly string[];
  first: string;
  second: string;
};

type SmartDraft = {
  holds: TitleHolds;
  rules: readonly RuleDraft[];
  order: string;
  limit: string;
};

export type { RuleDraft, SmartDraft, SmartRuleKind };
