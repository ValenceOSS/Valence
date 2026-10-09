import { describe, expect, it } from 'vitest';
import { readAudio } from './readAudio';
import { spacedName } from './spacedName';

/**
 * Reads the audio of a name as the parser does.
 */
const audioOf = (name: string) => readAudio(name, spacedName(name));

describe('readAudio', () => {
  it('reads the codecs, best first, and the channels', () => {
    expect(audioOf('Movie.2160p.TrueHD.Atmos.7.1-E')).toEqual({
      audio: ['atmos', 'truehd'],
      audioChannels: '7.1',
    });
    expect(audioOf('Movie.DTS-HD.MA.5.1.AC3')).toEqual({
      audio: ['dtsHdMa', 'ac3'],
      audioChannels: '5.1',
    });
  });

  it('reads Dolby Digital Plus however it is written', () => {
    for (const name of ['Movie DDP5.1', 'Movie DD+ 5.1', 'Movie EAC3', 'Movie DDPA 5.1']) {
      expect(audioOf(name).audio).toContain('eac3');
    }
  });

  it('reads the rest of the codecs', () => {
    expect(audioOf('Movie DTS-X').audio).toEqual(['dtsx']);
    expect(audioOf('Movie DTS AC3').audio).toEqual(['dts', 'ac3']);
    expect(audioOf('Movie DD5 1').audio).toEqual(['ac3']);
    expect(audioOf('Album FLAC').audio).toEqual(['flac']);
    expect(audioOf('Show AAC2.0').audio).toEqual(['aac']);
    expect(audioOf('Movie Opus').audio).toEqual(['opus']);
    expect(audioOf('Album MP3').audio).toEqual(['mp3']);
    expect(audioOf('Movie LPCM').audio).toEqual(['pcm']);
  });

  it('reads channels spaced out, and none where there are none', () => {
    expect(audioOf('Movie AAC 5 1 ESub').audioChannels).toBe('5.1');
    expect(audioOf('The Matrix 1 4 Pack').audioChannels).toBeNull();
    expect(audioOf('Movie 1080p')).toEqual({ audio: [], audioChannels: null });
  });
});
