import { NOTHING_ASKED } from '@ValenceClient/playback/NOTHING_ASKED';
import { soundtrackOnceKnown } from '@ValenceTv/playback/soundtrackOnceKnown';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const STREAMS: AudioStream[] = [
  { index: 1, codec: 'aac', channels: 2, language: 'jpn', isDefault: true, isAtmos: false },
  { index: 2, codec: 'aac', channels: 2, language: 'eng', isDefault: false, isAtmos: false },
];

describe('soundtrackOnceKnown', () => {
  it('asks for nothing straight away where nothing was remembered', () => {
    expect(soundtrackOnceKnown(null, undefined, null)).toBe(NOTHING_ASKED);
  });

  it('waits for the title and for the server to say what it can do', () => {
    expect(soundtrackOnceKnown('jpn', undefined, true)).toBeNull();
    expect(soundtrackOnceKnown('jpn', STREAMS, null)).toBeNull();
  });

  it('asks a server that picks by language for the language', () => {
    expect(soundtrackOnceKnown('jpn', STREAMS, true)).toEqual({
      audioStreamIndex: undefined,
      audioLanguage: 'ja',
    });
  });

  it('asks a server that could not say for the track', () => {
    expect(soundtrackOnceKnown('ja', STREAMS, false)).toEqual({
      audioStreamIndex: 1,
      audioLanguage: undefined,
    });
  });

  it('asks for nothing where the title could not be read', () => {
    expect(soundtrackOnceKnown('jpn', null, true)).toBe(NOTHING_ASKED);
  });
});
