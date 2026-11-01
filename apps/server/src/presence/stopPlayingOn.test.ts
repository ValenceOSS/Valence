import { describe, expect, it, vi } from 'vitest';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { stopPlayingOn } from './stopPlayingOn';

describe('stopPlayingOn', () => {
  it('ends the stream being converted for a tab playing video', async () => {
    const playback = createMemoryPlaybackService();
    const stop = vi.spyOn(playback, 'stop');

    await expect(stopPlayingOn({ playback }, 'tab-1', 'ses-1')).resolves.toBe(false);

    expect(stop).toHaveBeenCalledWith('ses-1', 'tab-1');
  });

  it('tells a tab playing an audiobook to stop, rather than ending a stream', async () => {
    const playback = createMemoryPlaybackService();
    const stop = vi.spyOn(playback, 'stop');
    const order = vi.fn(() => true);

    await expect(
      stopPlayingOn({ playback, bookDevices: { order } }, 'tab-1', 'ses-1'),
    ).resolves.toBe(true);

    expect(order).toHaveBeenCalledWith('tab-1', 'stop');
    expect(stop).not.toHaveBeenCalled();
  });

  it('leaves a tab that is playing nothing alone', async () => {
    const playback = createMemoryPlaybackService();
    const stop = vi.spyOn(playback, 'stop');

    await expect(stopPlayingOn({ playback }, 'tab-1', null)).resolves.toBe(false);

    expect(stop).not.toHaveBeenCalled();
  });
});
