import { describe, expect, it } from 'vitest';
import { aSessionPlayback } from './aSessionPlayback';

describe('aSessionPlayback', () => {
  it('is a film playing as it is, changed only where asked', () => {
    const playback = aSessionPlayback({ isPlaying: false });

    expect(playback.mode).toBe('direct');
    expect(playback.isPlaying).toBe(false);
    expect(playback.health?.durationSeconds).toBeGreaterThan(0);
  });
});
