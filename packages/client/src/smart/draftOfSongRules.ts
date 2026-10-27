import { draftOfRule } from './draftOfRule';
import type { SongRules } from '@ValenceContracts/schemas/SmartRules';
import type { SmartDraft } from './SmartDraft';

/**
 * A smart playlist's rules as the rule editor holds them, or a new playlist's to start from: fifty
 * songs in a shuffled order.
 *
 * @param rules - The playlist's rules, or nothing for a new one.
 * @returns The rules, ready to edit.
 */
const draftOfSongRules = (rules: SongRules | null): SmartDraft =>
  rules === null
    ? { holds: 'films', rules: [], order: 'random', limit: '50' }
    : {
        holds: 'films',
        rules: rules.rules.map((rule, at) => draftOfRule(rule, `rule-${String(at)}`)),
        order: rules.order,
        limit: rules.limit === null ? '' : String(rules.limit),
      };

export { draftOfSongRules };
