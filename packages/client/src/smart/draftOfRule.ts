import type { SongRule, TitleRule } from '@ValenceContracts/schemas/SmartRules';
import type { RuleDraft } from './SmartDraft';

/**
 * A number as a rule's field shows it, empty where there is none.
 *
 * @param value - The number.
 * @returns What the field shows.
 */
const textOf = (value: number | null): string => (value === null ? '' : String(value));

/**
 * A rule as the rule editor holds it while it is being changed.
 *
 * @param rule - The rule.
 * @param key - What tells it apart from the other rules being edited.
 * @returns The rule, ready to edit.
 */
const draftOfRule = (rule: SongRule | TitleRule, key: string): RuleDraft => {
  const empty = { key, kind: rule.kind, choice: '', picked: [], first: '', second: '' };

  switch (rule.kind) {
    case 'liked':
    case 'followedArtist':
      return { ...empty, choice: rule.is ? 'is' : 'isNot' };
    case 'genre':
      return { ...empty, choice: rule.isNegated ? 'isNot' : 'is', picked: rule.anyOf };
    case 'released':
      return { ...empty, first: textOf(rule.from), second: textOf(rule.to) };
    case 'plays':
      return { ...empty, first: textOf(rule.atLeast), second: textOf(rule.atMost) };
    case 'lastPlayed':
      return {
        ...empty,
        choice: rule.isNegated ? 'notWithin' : 'within',
        first: textOf(rule.withinDays),
      };
    case 'added':
      return { ...empty, first: textOf(rule.withinDays) };
    case 'runtime':
      return { ...empty, first: textOf(rule.atLeastMinutes), second: textOf(rule.atMostMinutes) };
    case 'watched':
      return { ...empty, choice: rule.state };
    case 'rating':
      return { ...empty, first: textOf(rule.atLeast) };
    case 'yourStars':
      return { ...empty, choice: String(rule.atLeast) };
    case 'library':
      return { ...empty, picked: rule.anyOf };
    case 'ageRating':
      return { ...empty, first: textOf(rule.atMost) };
  }
};

export { draftOfRule };
