import { describe, expect, it } from 'vitest';
import { idleWhatIsPlaying } from './idleWhatIsPlaying';

describe('idleWhatIsPlaying', () => {
  it('says nothing is playing, at rest at the start of nothing', () => {
    expect(idleWhatIsPlaying(0.4)).toMatchObject({
      title: 'Nothing is playing',
      isPlaying: false,
      positionSeconds: 0,
      durationSeconds: 0,
      remote: null,
    });
  });

  it('keeps the volume the listener set', () => {
    expect(idleWhatIsPlaying(0.4).volume).toBe(0.4);
  });
});
