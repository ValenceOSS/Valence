import { describe, expect, it } from 'vitest';
import { videoQualityIdOf } from './videoQualityIdOf';

describe('videoQualityIdOf', () => {
  it('makes a quality of a source and a resolution', () => {
    expect(videoQualityIdOf('webdl', '1080p')).toBe('webdl-1080p');
    expect(videoQualityIdOf('remux', '2160p')).toBe('remux-2160p');
  });

  it('takes a cinema recording whatever its resolution', () => {
    expect(videoQualityIdOf('cam', '1080p')).toBe('cam');
    expect(videoQualityIdOf('telesync', null)).toBe('telesync');
  });

  it('makes nothing of what is not known, or of what is no quality there is', () => {
    expect(videoQualityIdOf(null, '1080p')).toBeNull();
    expect(videoQualityIdOf('webdl', null)).toBeNull();
    expect(videoQualityIdOf('remux', '720p')).toBeNull();
  });
});
