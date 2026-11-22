import { describe, expect, it } from 'vitest';
import { languageToHear } from './languageToHear';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const STREAMS: AudioStream[] = [
  { index: 1, codec: 'aac', channels: 2, language: 'deu', isDefault: true, isAtmos: false },
  { index: 2, codec: 'aac', channels: 2, language: 'eng', isDefault: false, isAtmos: false },
];

describe('languageToHear', () => {
  it('hears the language asked for where the file carries it', () => {
    expect(languageToHear(STREAMS, 'english', 'fr')).toBe('en');
  });

  it('falls back to the library’s language where the file does not carry it', () => {
    expect(languageToHear(STREAMS, 'fre', 'en')).toBe('en');
    expect(languageToHear(STREAMS, 'fre', null)).toBeNull();
  });

  it('keeps the library’s language where nothing was asked', () => {
    expect(languageToHear(STREAMS, undefined, 'en')).toBe('en');
  });
});
