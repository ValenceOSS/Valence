import { describe, expect, it } from 'vitest';
import { readLocation } from '@ValenceClient/navigation/readLocation';
import { listeningInvitationTo } from './listeningInvitationTo';

describe('listeningInvitationTo', () => {
  it('opens the music section in the party, read back by the application itself', () => {
    const arrived = readLocation(listeningInvitationTo('party-1', 'https://valence.local'));

    expect(arrived.section).toBe('music');
    expect(arrived.party).toBe('party-1');
    expect(arrived.playing).toBeNull();
  });

  it('is absolute, since it is going somewhere else', () => {
    expect(listeningInvitationTo('party-1', 'https://valence.local')).toBe(
      'https://valence.local/music?party=party-1',
    );
  });
});
