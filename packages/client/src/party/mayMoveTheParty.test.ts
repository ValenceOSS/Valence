import { describe, expect, it } from 'vitest';
import { mayMoveTheParty } from '@ValenceClient/party/mayMoveTheParty';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';

describe('mayMoveTheParty', () => {
  it('lets whoever runs the party move it on', () => {
    expect(mayMoveTheParty(aWatchParty({ members: [aPartyMember({ role: 'host' })] }), 'me')).toBe(
      true,
    );
  });

  it('keeps a guest from moving it on, however loose the party is about pausing', () => {
    expect(mayMoveTheParty(aWatchParty({ members: [aPartyMember({ role: 'guest' })] }), 'me')).toBe(
      false,
    );
  });

  it('counts somebody the server has not named yet as a guest', () => {
    expect(mayMoveTheParty(aWatchParty({ members: [aPartyMember()] }), null)).toBe(false);
  });

  it('moves nothing outside a watch party', () => {
    expect(mayMoveTheParty(null, 'me')).toBe(false);
    expect(mayMoveTheParty(aWatchParty({ kind: 'listen', members: [aPartyMember()] }), 'me')).toBe(
      false,
    );
  });
});
