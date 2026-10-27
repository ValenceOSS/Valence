import type { RuleDraft, SmartRuleKind } from './SmartDraft';

/**
 * A new rule of one kind, filled in with something sensible to change from.
 *
 * @param kind - The kind of rule.
 * @param key - What tells it apart from the other rules being edited.
 * @returns The rule.
 */
const blankRule = (kind: SmartRuleKind, key: string): RuleDraft => {
  const empty = { key, kind, choice: '', picked: [], first: '', second: '' };

  switch (kind) {
    case 'liked':
    case 'followedArtist':
    case 'genre':
      return { ...empty, choice: 'is' };
    case 'released':
    case 'library':
      return empty;
    case 'plays':
      return { ...empty, first: '1' };
    case 'lastPlayed':
      return { ...empty, choice: 'within', first: '30' };
    case 'added':
      return { ...empty, first: '30' };
    case 'runtime':
      return { ...empty, second: '100' };
    case 'watched':
      return { ...empty, choice: 'unwatched' };
    case 'rating':
      return { ...empty, first: '7' };
    case 'yourStars':
      return { ...empty, choice: '4' };
    case 'ageRating':
      return { ...empty, first: '12' };
  }
};

export { blankRule };
