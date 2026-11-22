import { describe, expect, it } from 'vitest';
import { NOTHING_ASKED, soundtrackAsked } from './soundtrackAsked';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const ANIME: AudioStream[] = [
  { index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false, language: 'jpn' },
  { index: 2, codec: 'aac', channels: 2, isDefault: false, isAtmos: false, language: 'eng' },
];

const ENGLISH: AudioStream = {
  index: 1,
  codec: 'eac3',
  channels: 6,
  isDefault: true,
  isAtmos: false,
  language: 'eng',
};

const FILM: AudioStream[] = [
  ENGLISH,
  { index: 2, codec: 'aac', channels: 2, isDefault: false, isAtmos: false, language: 'fre' },
];

describe('soundtrackAsked', () => {
  it('asks a server that picks by language for the language, even where it is the default', () => {
    expect(soundtrackAsked('jpn', ANIME, true)).toEqual({
      audioStreamIndex: undefined,
      audioLanguage: 'ja',
    });
  });

  it('asks an older server for the track itself, even where it is the default', () => {
    expect(soundtrackAsked('jpn', ANIME, false)).toEqual({
      audioStreamIndex: 1,
      audioLanguage: undefined,
    });
    expect(soundtrackAsked('fre', FILM, false)).toEqual({
      audioStreamIndex: 2,
      audioLanguage: undefined,
    });
  });

  it('matches a language however either side spells it', () => {
    expect(soundtrackAsked('ja', ANIME, false).audioStreamIndex).toBe(1);
    expect(soundtrackAsked('Japanese', ANIME, true).audioLanguage).toBe('ja');
    expect(soundtrackAsked('jpn', [{ ...ENGLISH, language: 'ja', index: 3 }], false)).toEqual({
      audioStreamIndex: 3,
      audioLanguage: undefined,
    });
  });

  it('takes the main track over a commentary in the same language from an older server', () => {
    const withCommentary: AudioStream[] = [
      { index: 1, codec: 'aac', channels: 2, isDefault: false, isAtmos: false, language: 'jpn' },
      { index: 2, codec: 'aac', channels: 2, isDefault: true, isAtmos: false, language: 'jpn' },
    ];

    expect(soundtrackAsked('ja', withCommentary, false).audioStreamIndex).toBe(2);
  });

  it('asks for nothing where nothing was remembered', () => {
    expect(soundtrackAsked(null, ANIME, true)).toBe(NOTHING_ASKED);
    expect(soundtrackAsked(null, ANIME, false)).toBe(NOTHING_ASKED);
  });

  it('asks for nothing where the title has no soundtrack in that language', () => {
    expect(soundtrackAsked('ger', FILM, true)).toBe(NOTHING_ASKED);
    expect(soundtrackAsked('ger', FILM, false)).toBe(NOTHING_ASKED);
    expect(soundtrackAsked('jpn', [], true)).toBe(NOTHING_ASKED);
  });

  it('asks for nothing where the language remembered is no language at all', () => {
    expect(soundtrackAsked('und', [{ ...ENGLISH, language: 'und' }], false)).toBe(NOTHING_ASKED);
  });
});
