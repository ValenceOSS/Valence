import { beforeEach, describe, expect, it } from 'vitest';
import { manifestToLoad } from './manifestToLoad';
import { writePlaybackPreferences } from './playbackPreferences';

const DELIVERY = {
  manifestUrl: '/api/playback/session/a/index.m3u8',
  dashUrl: '/api/playback/session/a/manifest.mpd',
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('manifestToLoad', () => {
  it('loads the HLS playlist until this device asks for DASH', () => {
    expect(manifestToLoad(DELIVERY)).toEqual({ url: DELIVERY.manifestUrl, format: 'hls' });
  });

  it('loads the DASH manifest once this device asks for it', () => {
    writePlaybackPreferences({ streamingFormat: 'dash' });

    expect(manifestToLoad(DELIVERY)).toEqual({ url: DELIVERY.dashUrl, format: 'dash' });
  });

  it('falls back to HLS for a session the server wrote no DASH manifest for', () => {
    writePlaybackPreferences({ streamingFormat: 'dash' });

    expect(manifestToLoad({ ...DELIVERY, dashUrl: null })).toEqual({
      url: DELIVERY.manifestUrl,
      format: 'hls',
    });
  });
});
