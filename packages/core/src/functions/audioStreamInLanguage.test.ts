import { describe, expect, it } from 'vitest';
import { audioStreamInLanguage } from './audioStreamInLanguage';

const commentary = { index: 1, language: 'jpn', isDefault: false };
const main = { index: 2, language: 'ja', isDefault: true };
const english = { index: 3, language: 'eng', isDefault: false };

describe('audioStreamInLanguage', () => {
  it('finds the track in a language however either side spells it', () => {
    expect(audioStreamInLanguage([english, commentary], 'Japanese')).toBe(commentary);
    expect(audioStreamInLanguage([english], 'en')).toBe(english);
  });

  it('takes the default among several in the language', () => {
    expect(audioStreamInLanguage([commentary, main, english], 'jpn')).toBe(main);
  });

  it('finds nothing in a language the file does not carry, nor for no language at all', () => {
    expect(audioStreamInLanguage([english], 'fre')).toBeUndefined();
    expect(audioStreamInLanguage([english], null)).toBeUndefined();
    expect(audioStreamInLanguage([{ index: 4, language: 'und' }], 'und')).toBeUndefined();
  });
});
