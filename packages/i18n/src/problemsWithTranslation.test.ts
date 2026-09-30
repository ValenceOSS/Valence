import { describe, expect, it } from 'vitest';
import { problemsWithTranslation } from './problemsWithTranslation';

const ENGLISH = [
  { handler: 'common.cancel', text: 'Cancel', context: 'Closes a dialog.' },
  { handler: 'common.episodes.one', text: '{count} episode', context: 'How many episodes.' },
  { handler: 'common.episodes.other', text: '{count} episodes', context: 'How many episodes.' },
  { handler: 'people.welcome', text: 'Welcome, {name}', context: 'Greets a person.' },
];

describe('problemsWithTranslation', () => {
  it('finds nothing wrong with a translation of every string', () => {
    expect(
      problemsWithTranslation(ENGLISH, [
        { handler: 'common.cancel', text: 'Annuler', context: 'Closes a dialog.' },
        { handler: 'common.episodes.one', text: 'un épisode', context: 'How many episodes.' },
        {
          handler: 'common.episodes.other',
          text: '{count} épisodes',
          context: 'How many episodes.',
        },
        { handler: 'people.welcome', text: 'Bienvenue, {name}', context: 'Greets a person.' },
      ]),
    ).toEqual([]);
  });

  it('accepts the extra plural forms a language counts with', () => {
    expect(
      problemsWithTranslation(ENGLISH, [
        ...ENGLISH.slice(0, 2),
        { handler: 'common.episodes.few', text: '{count} odcinki', context: 'How many episodes.' },
        ...ENGLISH.slice(2),
      ]),
    ).toEqual([]);
  });

  it('refuses a missing handler and one the English does not have', () => {
    expect(
      problemsWithTranslation(ENGLISH, [
        ...ENGLISH.slice(1),
        { handler: 'common.close', text: 'Fermer', context: 'Closes a dialog.' },
      ]),
    ).toEqual(['common.cancel is missing', 'common.close is not in the English']);
  });

  it('refuses context that has drifted from the English', () => {
    expect(
      problemsWithTranslation(ENGLISH, [
        { handler: 'common.cancel', text: 'Annuler', context: 'Something else.' },
        ...ENGLISH.slice(1),
      ]),
    ).toEqual(['common.cancel has different context from the English']);
  });

  it('refuses a gap dropped or invented', () => {
    expect(
      problemsWithTranslation(ENGLISH, [
        ...ENGLISH.slice(0, 3),
        { handler: 'people.welcome', text: 'Bienvenue, {person}', context: 'Greets a person.' },
      ]),
    ).toEqual(['people.welcome fills {person} where the English fills {name}']);
  });
});
