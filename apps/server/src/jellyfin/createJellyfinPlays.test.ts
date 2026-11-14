import { describe, expect, it } from 'vitest';
import { createJellyfinPlays } from './createJellyfinPlays';

const play = {
  sessionId: 'session',
  mediaId: 'media',
  profileId: 'profile',
  durationSeconds: 60,
  ticket: null,
};

describe('createJellyfinPlays', () => {
  it('finds a play by the identifier it was handed, for the profile that started it', () => {
    const plays = createJellyfinPlays();
    const id = plays.open(play);

    expect(plays.read(id, 'profile')).toEqual(play);
    expect(plays.read(id, 'somebody else')).toBeNull();
  });

  it('forgets a play once it closes', () => {
    const plays = createJellyfinPlays();
    const id = plays.open(play);

    plays.close(id);

    expect(plays.read(id, 'profile')).toBeNull();
  });
});
