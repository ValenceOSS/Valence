import type { SongRule, TitleRule } from '@ValenceContracts/schemas/SmartRules';
import type { RuleDraft } from './SmartDraft';

/**
 * A number typed into a rule, where one was typed and it is a number, with a decimal comma read
 * as a point.
 *
 * @param text - What was typed.
 * @returns The number, nothing where the field was left empty, or not a number.
 */
const numberOf = (text: string): number | null =>
  text.trim() === '' ? null : Number(text.trim().replace(',', '.'));

/**
 * The rule a draft says, where it is complete enough to be one. Whether its numbers are in range is
 * left to the contract it is checked against.
 *
 * @param draft - The rule as it is being edited.
 * @returns The rule, or nothing where a number it needs is missing or is not a number.
 */
const ruleOfDraft = (draft: RuleDraft): SongRule | TitleRule | null => {
  const first = numberOf(draft.first);
  const second = numberOf(draft.second);

  if (Number.isNaN(first) || Number.isNaN(second)) {
    return null;
  }

  switch (draft.kind) {
    case 'liked':
    case 'followedArtist':
      return { kind: draft.kind, is: draft.choice !== 'isNot' };
    case 'genre':
      return { kind: 'genre', anyOf: [...draft.picked], isNegated: draft.choice === 'isNot' };
    case 'released':
      return { kind: 'released', from: first, to: second };
    case 'plays':
      return { kind: 'plays', atLeast: first, atMost: second };
    case 'lastPlayed':
      return first === null
        ? null
        : { kind: 'lastPlayed', withinDays: first, isNegated: draft.choice === 'notWithin' };
    case 'added':
      return first === null ? null : { kind: 'added', withinDays: first };
    case 'runtime':
      return { kind: 'runtime', atLeastMinutes: first, atMostMinutes: second };
    case 'watched':
      return draft.choice === 'unwatched' ||
        draft.choice === 'inProgress' ||
        draft.choice === 'finished' ||
        draft.choice === 'notFinished'
        ? { kind: 'watched', state: draft.choice }
        : null;
    case 'rating':
      return first === null ? null : { kind: 'rating', atLeast: first };
    case 'yourStars':
      return { kind: 'yourStars', atLeast: Number(draft.choice) };
    case 'library':
      return { kind: 'library', anyOf: [...draft.picked] };
    case 'ageRating':
      return first === null ? null : { kind: 'ageRating', atMost: first };
  }
};

export { ruleOfDraft };
