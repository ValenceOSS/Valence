import { describe, expect, it, vi } from 'vitest';
import { attachRemux } from '@ValenceScreens/playback/engine/attachRemux';

const dispose = vi.fn();

vi.mock('mediabunny', () => ({
  ALL_FORMATS: [],
  UrlSource: class {},
  Input: class {
    getPrimaryVideoTrack = () => Promise.resolve(null);
    getAudioTracks = () => Promise.resolve([]);
    computeDuration = () => Promise.resolve(60);
    dispose = dispose;
  },
}));

describe('attachRemux', () => {
  it('refuses a file with no picture to repackage, and lets go of it', async () => {
    await expect(
      attachRemux({
        element: document.createElement('video'),
        url: '/api/playback/film/stream',
        startSeconds: 0,
        audioTrackAt: 0,
        onFault: vi.fn(),
      }),
    ).rejects.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
