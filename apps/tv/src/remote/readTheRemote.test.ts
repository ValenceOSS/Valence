import { readTheRemote } from '@ValenceTv/remote/readTheRemote';

describe('readTheRemote', () => {
  it('hears the separate play and pause keys as the one play-pause button', () => {
    expect(readTheRemote({ eventType: 'play', eventKeyAction: 1 })).toEqual({
      eventType: 'playPause',
      eventKeyAction: 1,
    });
    expect(readTheRemote({ eventType: 'pause', eventKeyAction: 1 }).eventType).toBe('playPause');
  });

  it('passes every other button through as it is', () => {
    const held = { eventType: 'longLeft', eventKeyAction: 0 };

    expect(readTheRemote(held)).toBe(held);
  });
});
