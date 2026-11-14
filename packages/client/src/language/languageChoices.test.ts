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

  it('names the first choice after whatever it follows, where that is not the device', () => {
    expect(languageChoices('Same as the server (Deutsch)')[0]).toEqual({
      id: 'device',
      label: 'Same as the server (Deutsch)',
    });
  });
});
