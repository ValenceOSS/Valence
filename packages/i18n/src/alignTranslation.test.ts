import { describe, expect, it } from 'vitest';
import { alignTranslation } from './alignTranslation';

const ENGLISH = [
  { handler: 'common.cancel', text: 'Cancel', context: 'Closes a dialog.' },
  { handler: 'common.episodes.one', text: '{count} episode', context: 'How many episodes.' },
  { handler: 'common.episodes.other', text: '{count} episodes', context: 'How many episodes.' },
];

describe('alignTranslation', () => {
  it('gives a new language the English words to start from', () => {
    expect(alignTranslation(ENGLISH, [])).toEqual(ENGLISH);
  });

  it('keeps the words already translated and takes the English context', () => {
    expect(
      alignTranslation(ENGLISH, [
        { handler: 'common.cancel', text: 'Annuler', context: 'Old context.' },
      ])[0],
    ).toEqual({ handler: 'common.cancel', text: 'Annuler', context: 'Closes a dialog.' });
  });

  it('drops a handler the English no longer has', () => {
    expect(
      alignTranslation(ENGLISH, [
        { handler: 'common.close', text: 'Fermer', context: 'Closes a dialog.' },
      ]).map((entry) => entry.handler),
    ).toEqual(['common.cancel', 'common.episodes.one', 'common.episodes.other']);
  });

  it('keeps a language’s extra plural forms just before the .other they belong to', () => {
    expect(
      alignTranslation(ENGLISH, [
        { handler: 'common.episodes.few', text: '{count} odcinki', context: 'Old context.' },
        { handler: 'common.films.few', text: '{count} filmy', context: 'Old context.' },
      ]).map((entry) => [entry.handler, entry.context]),
    ).toEqual([
      ['common.cancel', 'Closes a dialog.'],
      ['common.episodes.one', 'How many episodes.'],
      ['common.episodes.few', 'How many episodes.'],
      ['common.episodes.other', 'How many episodes.'],
    ]);
  });
});
