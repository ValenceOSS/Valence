import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@ValenceI18n/LANGUAGES';
import { languageChoices } from './languageChoices';

describe('languageChoices', () => {
  it('offers following the device first, then every language named in itself', () => {
    const choices = languageChoices();

    expect(choices[0]?.id).toBe('device');
    expect(choices).toHaveLength(LANGUAGES.length + 1);
    expect(choices.find((choice) => choice.id === 'de')?.label).toBe('Deutsch');
  });
});
