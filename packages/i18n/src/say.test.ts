import { describe, expect, it } from 'vitest';
import { say } from './say';

describe('say', () => {
  it('says the words for a handler', () => {
    expect(say('error.common.nobodyIsSignedIn')).toBe('You’re not signed in.');
  });

  it('fills each gap from what it is given', () => {
    expect(say('requests.downloads.clientSaid', { name: 'qBittorrent', said: 'disk full' })).toBe(
      'qBittorrent said: disk full',
    );
  });

  it('leaves a gap with nothing given for it as written, so it shows rather than vanishes', () => {
    expect(say('requests.downloads.clientSaid', { name: 'qBittorrent' })).toBe(
      'qBittorrent said: {said}',
    );
  });
});
