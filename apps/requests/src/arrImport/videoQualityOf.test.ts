import { describe, expect, it } from 'vitest';
import { videoQualityOf } from './videoQualityOf';

describe('videoQualityOf', () => {
  it('reads Radarr’s and Sonarr’s quality names as a source and a resolution', () => {
    expect(videoQualityOf('Bluray-1080p')).toEqual({ source: 'bluray', resolution: '1080p' });
    expect(videoQualityOf('Remux-2160p')).toEqual({ source: 'remux', resolution: '2160p' });
    expect(videoQualityOf('Bluray-2160p Remux')).toEqual({ source: 'remux', resolution: '2160p' });
    expect(videoQualityOf('WEBRip-720p')).toEqual({ source: 'webrip', resolution: '720p' });
    expect(videoQualityOf('WEBDL-480p')).toEqual({ source: 'webdl', resolution: '480p' });
    expect(videoQualityOf('HDTV-1080p')).toEqual({ source: 'hdtv', resolution: '1080p' });
    expect(videoQualityOf('SDTV')).toEqual({ source: 'hdtv', resolution: '480p' });
    expect(videoQualityOf('DVD-R')).toEqual({ source: 'dvd', resolution: '480p' });
    expect(videoQualityOf('TELESYNC')).toEqual({ source: 'telesync', resolution: null });
    expect(videoQualityOf('CAM')).toEqual({ source: 'cam', resolution: null });
  });

  it('has none for a quality Valence cannot match', () => {
    expect(videoQualityOf('BR-DISK')).toBeNull();
    expect(videoQualityOf('Raw-HD')).toBeNull();
    expect(videoQualityOf('Unknown')).toBeNull();
    expect(videoQualityOf('Bluray-1440p')).toBeNull();
  });
});
