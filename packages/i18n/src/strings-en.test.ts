import { describe, expect, it } from 'vitest';
import { problemsWith } from '@ValenceTranslations/problemsWith';
import screens from '@ValenceTranslations/screens.json';
import strings from '@ValenceTranslations/strings-en.json';
import values from '@ValenceTranslations/values-en.json';

describe('the strings Valence-Translations holds', () => {
  it('have no problem its own check would refuse, so the app never draws a missing word', () => {
    expect(problemsWith({ strings, screens, values })).toEqual([]);
  });
});
