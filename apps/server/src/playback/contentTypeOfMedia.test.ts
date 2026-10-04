import { describe, expect, it } from 'vitest';
import { contentTypeOfMedia } from './contentTypeOfMedia';

describe('contentTypeOfMedia', () => {
  it('names the type of a file the media service names', () => {
    expect(contentTypeOfMedia('/media/films/Arrival (2016)/Arrival.MP4')).toBe('video/mp4');
    expect(contentTypeOfMedia('/media/music/Song.flac')).toBe('audio/flac');
  });

  it('sends anything else as plain bytes', () => {
    expect(contentTypeOfMedia('/media/anime/Show/Show - 01.mkv')).toBe('application/octet-stream');
    expect(contentTypeOfMedia('/media/odd/no-extension')).toBe('application/octet-stream');
  });
});
