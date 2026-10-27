import { describe, expect, it } from 'vitest';
import { draftOfRule } from './draftOfRule';
import { ruleOfDraft } from './ruleOfDraft';
import type { SongRule, TitleRule } from '@ValenceContracts/schemas/SmartRules';

const RULES: (SongRule | TitleRule)[] = [
  { kind: 'liked', is: false },
  { kind: 'followedArtist', is: true },
  { kind: 'genre', anyOf: ['Rock', 'Pop'], isNegated: true },
  { kind: 'released', from: 1990, to: 1999 },
  { kind: 'plays', atLeast: null, atMost: 0 },
  { kind: 'lastPlayed', withinDays: 14, isNegated: false },
  { kind: 'added', withinDays: 7 },
  { kind: 'runtime', atLeastMinutes: 60, atMostMinutes: null },
  { kind: 'watched', state: 'inProgress' },
  { kind: 'rating', atLeast: 7.5 },
  { kind: 'yourStars', atLeast: 3 },
  { kind: 'library', anyOf: ['films'] },
  { kind: 'ageRating', atMost: 12 },
];

describe('draftOfRule', () => {
  it('holds every rule so that reading it back gives the same rule', () => {
    for (const rule of RULES) {
      expect(ruleOfDraft(draftOfRule(rule, 'k'))).toEqual(rule);
    }
  });

  it('shows a number left out as an empty field', () => {
    expect(draftOfRule({ kind: 'released', from: null, to: 2000 }, 'k')).toMatchObject({
      first: '',
      second: '2000',
    });
  });
});
