import { describe, expect, it, vi } from 'vitest';
import { attachEngine } from '@ValenceScreens/playback/engine/attachEngine';

const dispose = vi.fn();

vi.mock('mediabunny', () => ({
  ALL_FORMATS: [],
  UrlSource: class {},
  VideoSampleSink: class {},
  Input: class {
    getPrimaryVideoTrack = () => Promise.resolve(null);
    getAudioTracks = () => Promise.resolve([]);
    computeDuration = () => Promise.resolve(60);
    dispose = dispose;
  },
}));

describe('attachEngine', () => {
  it('refuses a file with no picture to decode, and lets go of it', async () => {
    await expect(
      attachEngine({
        element: document.createElement('video'),
        canvas: document.createElement('canvas'),
        url: '/api/playback/film/stream',
        startSeconds: 0,
        audioTrackAt: 0,
        brightness: 1,
        onFault: vi.fn(),
      }),
    ).rejects.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
