import { draftOfRule } from './draftOfRule';
import type { TitleRules } from '@ValenceContracts/schemas/SmartRules';
import type { SmartDraft } from './SmartDraft';

/**
 * A smart collection's rules as the rule editor holds them, or a new collection's to start from:
 * films, newest first.
 *
 * @param rules - The collection's rules, or nothing for a new one.
 * @returns The rules, ready to edit.
 */
const draftOfTitleRules = (rules: TitleRules | null): SmartDraft =>
  rules === null
    ? { holds: 'films', rules: [], order: 'added', limit: '' }
    : {
        holds: rules.holds,
        rules: rules.rules.map((rule, at) => draftOfRule(rule, `rule-${String(at)}`)),
        order: rules.order,
        limit: rules.limit === null ? '' : String(rules.limit),
      };

export { draftOfTitleRules };
